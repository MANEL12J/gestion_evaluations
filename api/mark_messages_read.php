<?php
session_start();
require_once "config.php";

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non autorisé']);
    exit;
}

// Récupérer les données du corps de la requête
$data = json_decode(file_get_contents('php://input'), true);
$sender_id = isset($data['sender_id']) ? $data['sender_id'] : null;

if (!$sender_id) {
    http_response_code(400);
    echo json_encode(['error' => 'sender_id manquant']);
    exit;
}

try {
    // Marquer tous les messages de cet expéditeur comme lus
    $query = "UPDATE messages 
             SET is_read = 1 
             WHERE sender_id = :sender_id 
             AND receiver_id = :receiver_id 
             AND is_read = 0";
             
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':sender_id' => $sender_id,
        ':receiver_id' => $_SESSION['user_id']
    ]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
