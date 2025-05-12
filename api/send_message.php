<?php
session_start();
require "config.php";

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non autorisé']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['receiver_id']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Données manquantes']);
    exit;
}

$sender_id = $_SESSION['user_id'];
$receiver_id = (int)$data['receiver_id'];
$message = $data['message'];

try {
    $query = "INSERT INTO messages (sender_id, receiver_id, message) VALUES (:sender_id, :receiver_id, :message)";
    $stmt = $pdo->prepare($query);
    
    $stmt->execute([
        ':sender_id' => $sender_id,
        ':receiver_id' => $receiver_id,
        ':message' => $message
    ]);
    
    $message_id = $pdo->lastInsertId();
    echo json_encode(['success' => true, 'message_id' => $message_id]);
    
} catch(PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de l\'envoi du message']);
}
