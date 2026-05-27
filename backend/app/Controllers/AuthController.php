<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/UserModel.php';

class AuthController
{
    private UserModel $model;

    public function __construct()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $this->model = new UserModel();
    }

    public function login(): void
    {
        $body = json_decode(file_get_contents('php://input'), true);

        if (empty($body['email']) || empty($body['password'])) {
            http_response_code(422);
            echo json_encode(['error' => 'email et password sont requis']);
            return;
        }

        $user = $this->model->findByEmail($body['email']);

        if (!$user || !password_verify($body['password'], $user['mot_de_passe'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Identifiants invalides']);
            return;
        }

        session_regenerate_id(true);

        $_SESSION['user'] = [
            'id'     => $user['id'],
            'nom'    => $user['nom'],
            'prenom' => $user['prenom'],
            'email'  => $user['email'],
            'role'   => $user['role'],
        ];

        echo json_encode($_SESSION['user']);
    }

    public function logout(): void
    {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $p['path'], $p['domain'], $p['secure'], $p['httponly']
            );
        }

        session_destroy();

        echo json_encode(['message' => 'Déconnecté']);
    }

    public function me(): void
    {
        if (empty($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Non authentifié']);
            return;
        }

        echo json_encode($_SESSION['user']);
    }
}
