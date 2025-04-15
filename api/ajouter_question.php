<?php
require "config.php";
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'enseignant') {
    echo json_encode(["status" => "error", "message" => "Accès non autorisé"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$evaluation_id = $data['evaluation_id'];
$texte = $data['texte'];
$type = $data['type'];

$sql = "INSERT INTO questions (evaluation_id, texte, type) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iss", $evaluation_id, $texte, $type);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Question ajoutée"]);
} else {
    echo json_encode(["status" => "error", "message" => "Erreur d'ajout"]);
}
?>
