<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/PresenceModel.php';

class PresenceController
{
    private PresenceModel $model;

    public function __construct()
    {
        $this->model = new PresenceModel();
    }

    public function index(): void
    {
        $seanceId   = isset($_GET['seance_id'])   ? (int)$_GET['seance_id']   : null;
        $etudiantId = isset($_GET['etudiant_id']) ? (int)$_GET['etudiant_id'] : null;

        if ($seanceId) {
            echo json_encode($this->model->findBySeance($seanceId));
            return;
        }
        if ($etudiantId) {
            echo json_encode($this->model->findByEtudiant($etudiantId));
            return;
        }

        http_response_code(400);
        echo json_encode(['error' => 'Paramètre seance_id ou etudiant_id requis']);
    }

    public function init(int $seanceId): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();

        // Récupère l'enseignant_id depuis le session user_id
        $db = getConnection();
        $stmt = $db->prepare("SELECT id FROM enseignants WHERE utilisateur_id = ?");
        $stmt->execute([$_SESSION['user']['id']]);
        $enseignant = $stmt->fetch();

        if (!$enseignant) {
            http_response_code(403);
            echo json_encode(['error' => 'Profil enseignant requis']);
            return;
        }

        $count = $this->model->initSeance($seanceId, $enseignant['id']);
        echo json_encode(['message' => "Feuille de présence initialisée", 'created' => $count]);
    }

    public function upsert(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        foreach (['etudiant_id', 'seance_id', 'statut'] as $f) {
            if (empty($body[$f])) {
                http_response_code(422);
                echo json_encode(['error' => "Champ '$f' requis"]);
                return;
            }
        }

        $statutsValides = ['present', 'absent', 'retard', 'excuse'];
        if (!in_array($body['statut'], $statutsValides, true)) {
            http_response_code(422);
            echo json_encode(['error' => 'Statut invalide']);
            return;
        }

        $db = getConnection();
        $stmt = $db->prepare("SELECT id FROM enseignants WHERE utilisateur_id = ?");
        $stmt->execute([$_SESSION['user']['id']]);
        $enseignant = $stmt->fetch();
        $enseignantId = $enseignant ? $enseignant['id'] : 1;

        $this->model->upsert(
            (int)$body['etudiant_id'],
            (int)$body['seance_id'],
            $body['statut'],
            $body['commentaire'] ?? null,
            $enseignantId
        );

        echo json_encode(['message' => 'Présence enregistrée']);
    }
}
