<?php
session_start(); // Démarrer la session
require "config.php";
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header("Content-Type: application/json");
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email'], $data['password'])) {
    echo json_encode(["success" => false, "message" => "Champs manquants"]);
    exit;
}

$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$password = $data['password'];

try {
    $stmt = $pdo->prepare("SELECT id, password, type FROM utilisateurs WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($email === 'admin' && $password === 'admin2025') {
        $_SESSION['user_id'] = 'admin';
        $_SESSION['user_type'] = 'admin';
        error_log("Login admin - Session créée: " . print_r($_SESSION, true));
        echo json_encode([
            "success" => true,
            "message" => "Connexion administrateur réussie",
            "type" => "admin"
        ]);
    } else if ($user && password_verify($password, $user['password'])) {
        // Stocker les informations dans la session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_type'] = $user['type']; // "enseignant" ou "etudiant"

        echo json_encode([
            "success" => true,
            "message" => "Connexion réussie",
            "id" => $user['id'],
            "type" => $user['type']
        ]);
        
    } else {
        echo json_encode(["success" => false, "message" => "Email ou mot de passe incorrect"]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erreur SQL : " . $e->getMessage()]);
}
?>
