<?php

declare(strict_types=1);

class DashboardController
{
    private PDO $db;

    public function __construct()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $this->db = getConnection();
    }

    // ── Étudiant ──────────────────────────────────────────────────────────

    public function etudiant(): void
    {
        $userId = $_SESSION['user']['id'];

        $etudiant = $this->fetchOne(
            "SELECT id FROM etudiants WHERE utilisateur_id = ?",
            [$userId]
        );

        if (!$etudiant) {
            http_response_code(404);
            echo json_encode(['error' => 'Profil étudiant introuvable']);
            return;
        }

        $etudiantId = $etudiant['id'];

        $cours = $this->fetchAll(
            "SELECT c.id, c.code, c.nom, c.credits, c.semestre,
                    CONCAT(u.prenom, ' ', u.nom) AS enseignant_nom
             FROM inscriptions i
             JOIN cours c ON c.id = i.cours_id
             LEFT JOIN enseignants en ON en.id = c.enseignant_id
             LEFT JOIN utilisateurs u ON u.id = en.utilisateur_id
             WHERE i.etudiant_id = ? AND i.statut = 'actif'
             ORDER BY c.code",
            [$etudiantId]
        );

        $notesRecentes = $this->fetchAll(
            "SELECT n.note, n.date_saisie, ev.nom AS evaluation_nom,
                    ev.type AS evaluation_type, c.code AS cours_code, c.nom AS cours_nom
             FROM notes n
             JOIN evaluations ev ON ev.id = n.evaluation_id
             JOIN cours c ON c.id = ev.cours_id
             WHERE n.etudiant_id = ?
             ORDER BY n.date_saisie DESC
             LIMIT 5",
            [$etudiantId]
        );

        $prochainesSeances = $this->fetchAll(
            "SELECT s.jour_semaine, s.heure_debut, s.heure_fin, s.type,
                    c.code AS cours_code, c.nom AS cours_nom,
                    sa.nom AS salle_nom, sa.batiment
             FROM seances s
             JOIN cours c ON c.id = s.cours_id
             JOIN inscriptions i ON i.cours_id = c.id
             LEFT JOIN salles sa ON sa.id = s.salle_id
             WHERE i.etudiant_id = ? AND i.statut = 'actif'
               AND s.date_fin >= CURDATE()
             ORDER BY FIELD(s.jour_semaine,'lundi','mardi','mercredi','jeudi','vendredi','samedi'),
                      s.heure_debut
             LIMIT 10",
            [$etudiantId]
        );

        $absences = $this->fetchAll(
            "SELECT p.statut, p.commentaire, p.created_at,
                    s.jour_semaine, s.heure_debut, s.heure_fin,
                    c.code AS cours_code, c.nom AS cours_nom
             FROM presences p
             JOIN seances s ON s.id = p.seance_id
             JOIN cours c ON c.id = s.cours_id
             WHERE p.etudiant_id = ? AND p.statut IN ('absent','retard')
             ORDER BY p.created_at DESC",
            [$etudiantId]
        );

        echo json_encode(compact('cours', 'notesRecentes', 'prochainesSeances', 'absences'));
    }

    // ── Enseignant ────────────────────────────────────────────────────────

    public function enseignant(): void
    {
        $userId = $_SESSION['user']['id'];

        $enseignant = $this->fetchOne(
            "SELECT id FROM enseignants WHERE utilisateur_id = ?",
            [$userId]
        );

        if (!$enseignant) {
            http_response_code(404);
            echo json_encode(['error' => 'Profil enseignant introuvable']);
            return;
        }

        $enseignantId = $enseignant['id'];

        $cours = $this->fetchAll(
            "SELECT c.id, c.code, c.nom, c.credits, c.semestre, c.niveau,
                    COUNT(i.id) AS nb_inscrits, c.capacite_max
             FROM cours c
             LEFT JOIN inscriptions i ON i.cours_id = c.id AND i.statut = 'actif'
             WHERE c.enseignant_id = ? AND c.actif = 1
             GROUP BY c.id
             ORDER BY c.code",
            [$enseignantId]
        );

        $evaluationsAVenir = $this->fetchAll(
            "SELECT ev.id, ev.nom, ev.type, ev.coefficient, ev.date_evaluation,
                    ev.verrouille, c.code AS cours_code, c.nom AS cours_nom,
                    COUNT(n.id) AS notes_saisies,
                    (SELECT COUNT(*) FROM inscriptions i2
                     WHERE i2.cours_id = ev.cours_id AND i2.statut = 'actif') AS nb_inscrits
             FROM evaluations ev
             JOIN cours c ON c.id = ev.cours_id
             LEFT JOIN notes n ON n.evaluation_id = ev.id
             WHERE c.enseignant_id = ?
               AND (ev.date_evaluation IS NULL OR ev.date_evaluation >= CURDATE())
               AND ev.verrouille = 0
             GROUP BY ev.id
             ORDER BY ev.date_evaluation ASC
             LIMIT 10",
            [$enseignantId]
        );

        $prochainesSeances = $this->fetchAll(
            "SELECT s.jour_semaine, s.heure_debut, s.heure_fin, s.type,
                    c.code AS cours_code, c.nom AS cours_nom,
                    sa.nom AS salle_nom, sa.batiment
             FROM seances s
             JOIN cours c ON c.id = s.cours_id
             LEFT JOIN salles sa ON sa.id = s.salle_id
             WHERE c.enseignant_id = ? AND s.date_fin >= CURDATE()
             ORDER BY FIELD(s.jour_semaine,'lundi','mardi','mercredi','jeudi','vendredi','samedi'),
                      s.heure_debut
             LIMIT 10",
            [$enseignantId]
        );

        echo json_encode(compact('cours', 'evaluationsAVenir', 'prochainesSeances'));
    }

    // ── Admin ─────────────────────────────────────────────────────────────

    public function admin(): void
    {
        $stats = $this->fetchOne(
            "SELECT
                (SELECT COUNT(*) FROM etudiants WHERE statut = 'inscrit')          AS total_etudiants,
                (SELECT COUNT(*) FROM enseignants)                                  AS total_enseignants,
                (SELECT COUNT(*) FROM cours WHERE actif = 1)                        AS total_cours_actifs,
                (SELECT COUNT(*) FROM inscriptions WHERE statut = 'actif')          AS total_inscriptions,
                (SELECT COUNT(*) FROM notes)                                        AS total_notes,
                (SELECT COUNT(*) FROM presences WHERE statut = 'absent')            AS total_absences",
            []
        );

        $coursPopulaires = $this->fetchAll(
            "SELECT c.code, c.nom, c.capacite_max,
                    COUNT(i.id) AS nb_inscrits,
                    ROUND(COUNT(i.id) / c.capacite_max * 100, 1) AS taux_remplissage
             FROM cours c
             LEFT JOIN inscriptions i ON i.cours_id = c.id AND i.statut = 'actif'
             WHERE c.actif = 1
             GROUP BY c.id
             ORDER BY nb_inscrits DESC
             LIMIT 5",
            []
        );

        $derniersInscrits = $this->fetchAll(
            "SELECT u.nom, u.prenom, u.email, e.numero_etudiant,
                    e.filiere, e.niveau, e.created_at
             FROM etudiants e
             JOIN utilisateurs u ON u.id = e.utilisateur_id
             ORDER BY e.created_at DESC
             LIMIT 5",
            []
        );

        echo json_encode(compact('stats', 'coursPopulaires', 'derniersInscrits'));
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private function fetchAll(string $sql, array $params): array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    private function fetchOne(string $sql, array $params): array|false
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch();
    }
}
