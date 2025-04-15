<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require "config.php";

$data = json_decode(file_get_contents("php://input"), true);

// Vérifier si les données sont bien reçues
if (!$data) {
    echo json_encode(["success" => false, "message" => "Aucune donnée reçue"]);
    exit;
}

// Vérifier si les champs sont bien envoyés
if (!isset($data['nom'], $data['email'], $data['password'], $data['type'])) {
    echo json_encode(["success" => false, "message" => "Champs manquants"]);
    exit;
}

$nom = htmlspecialchars($data['nom']);
$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$password = password_hash($data['password'], PASSWORD_DEFAULT);
$type = $data['type'];

try {
    $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, email, password, type) VALUES (?, ?, ?, ?)");
    
    if ($stmt->execute([$nom, $email, $password, $type])) {
        echo json_encode(["success" => true, "message" => "Inscription réussie"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Erreur lors de l'insertion"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur SQL : " . $e->getMessage()]);
}
?>
