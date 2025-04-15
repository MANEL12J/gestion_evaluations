<?php
require "config.php";
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'enseignant') {
    echo json_encode(["status" => "error", "message" => "Accès non autorisé"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'];

$sql = "DELETE FROM questions WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Question supprimée"]);
} else {
    echo json_encode(["status" => "error", "message" => "Erreur de suppression"]);
}
?>
