<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/InscriptionModel.php';

class InscriptionController
{
    private InscriptionModel $model;

    public function __construct()
    {
        $this->model = new InscriptionModel();
    }

    public function index(): void
    {
        $etudiantId = isset($_GET['etudiant_id']) ? (int)$_GET['etudiant_id'] : null;
        $coursId    = isset($_GET['cours_id'])    ? (int)$_GET['cours_id']    : null;

        if ($etudiantId) {
            echo json_encode($this->model->findByEtudiant($etudiantId));
            return;
        }

        if ($coursId) {
            echo json_encode($this->model->findByCours($coursId));
            return;
        }

        http_response_code(400);
        echo json_encode(['error' => 'Paramètre etudiant_id ou cours_id requis']);
    }

    public function store(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $sessionUser = $_SESSION['user'] ?? null;
        if (!$sessionUser) { http_response_code(401); echo json_encode(['error' => 'Non authentifié']); return; }

        $body    = json_decode(file_get_contents('php://input'), true) ?? [];
        $coursId = (int)($body['cours_id'] ?? 0);

        if (!$coursId) {
            http_response_code(422);
            echo json_encode(['error' => "Le champ 'cours_id' est requis"]);
            return;
        }

        // Étudiant s'inscrit lui-même ; admin peut inscrire n'importe qui
        if ($sessionUser['role'] === 'etudiant') {
            $etudiantId = (int)($sessionUser['profil_id'] ?? 0);
            if (!$etudiantId) {
                http_response_code(422);
                echo json_encode(['error' => 'Profil étudiant introuvable en session']);
                return;
            }
        } else {
            $etudiantId = (int)($body['etudiant_id'] ?? 0);
            if (!$etudiantId) {
                http_response_code(422);
                echo json_encode(['error' => "Le champ 'etudiant_id' est requis"]);
                return;
            }
        }

        if ($this->model->isAlreadyInscrit($etudiantId, $coursId)) {
            http_response_code(409);
            echo json_encode(['error' => 'Étudiant déjà inscrit à ce cours']);
            return;
        }

        $inscrits    = $this->model->countInscrits($coursId);
        $capaciteMax = $this->model->getCapaciteMax($coursId);

        if ($inscrits >= $capaciteMax) {
            http_response_code(400);
            echo json_encode([
                'error'        => 'Capacité maximale du cours atteinte',
                'capacite_max' => $capaciteMax,
                'inscrits'     => $inscrits,
            ]);
            return;
        }

        $id = $this->model->inscrire($etudiantId, $coursId);
        http_response_code(201);
        echo json_encode(['id' => $id]);
    }

    public function destroy(int $id): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $sessionUser = $_SESSION['user'] ?? null;

        // Étudiant ne peut annuler que ses propres inscriptions
        if ($sessionUser && $sessionUser['role'] === 'etudiant') {
            $inscription = $this->model->findById($id);
            $profilId    = (int)($sessionUser['profil_id'] ?? 0);
            if (!$inscription || (int)$inscription['etudiant_id'] !== $profilId) {
                http_response_code(403);
                echo json_encode(['error' => 'Action non autorisée']);
                return;
            }
        }

        $annule = $this->model->annuler($id);

        if (!$annule) {
            http_response_code(404);
            echo json_encode(['error' => 'Inscription introuvable']);
            return;
        }

        echo json_encode(['message' => 'Inscription annulée']);
    }
}
