<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/CoursModel.php';

class CoursController
{
    private CoursModel $model;

    public function __construct()
    {
        $this->model = new CoursModel();
    }

    public function index(): void
    {
        echo json_encode($this->model->findAll());
    }

    public function show(int $id): void
    {
        $cours = $this->model->findById($id);

        if (!$cours) {
            http_response_code(404);
            echo json_encode(['error' => 'Cours introuvable']);
            return;
        }

        echo json_encode($cours);
    }

    public function store(): void
    {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        foreach (['code', 'nom'] as $field) {
            if (empty($body[$field])) {
                http_response_code(422);
                echo json_encode(['error' => "Le champ '$field' est requis"]);
                return;
            }
        }

        try {
            $id = $this->model->create($body);
            http_response_code(201);
            echo json_encode(['id' => $id]);
        } catch (\PDOException $e) {
            http_response_code(409);
            echo json_encode(['error' => 'Code cours déjà utilisé']);
        }
    }

    public function update(int $id): void
    {
        $cours = $this->model->findById($id);
        if (!$cours) {
            http_response_code(404);
            echo json_encode(['error' => 'Cours introuvable']);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $this->model->update($id, $body);
        echo json_encode(['message' => 'Cours mis à jour']);
    }

    public function destroy(int $id): void
    {
        $cours = $this->model->findById($id);
        if (!$cours) {
            http_response_code(404);
            echo json_encode(['error' => 'Cours introuvable']);
            return;
        }

        $this->model->disable($id);
        echo json_encode(['message' => 'Cours désactivé']);
    }
}
