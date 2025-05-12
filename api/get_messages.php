<?php
session_start();
require "config.php";

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non autorisé']);
    exit;
}

$user_id = $_SESSION['user_id'];
$other_user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

if (!$other_user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID utilisateur manquant']);
    exit;
}

try {
    // Récupérer les messages
    $query = "
        SELECT m.*, 
               u1.nom as sender_name,
               u2.nom as receiver_name
        FROM messages m
        JOIN utilisateurs u1 ON m.sender_id = u1.id
        JOIN utilisateurs u2 ON m.receiver_id = u2.id
        WHERE (m.sender_id = :sender1 AND m.receiver_id = :receiver1) 
           OR (m.sender_id = :sender2 AND m.receiver_id = :receiver2)
        ORDER BY m.timestamp ASC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':sender1' => $user_id,
        ':receiver1' => $other_user_id,
        ':sender2' => $other_user_id,
        ':receiver2' => $user_id
    ]);

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Marquer les messages comme lus
    $update_query = "UPDATE messages SET is_read = 1 WHERE receiver_id = :receiver_id AND sender_id = :sender_id AND is_read = 0";
    $update_stmt = $pdo->prepare($update_query);
    $update_stmt->execute([
        ':receiver_id' => $user_id,
        ':sender_id' => $other_user_id
    ]);

    echo json_encode(['success' => true, 'messages' => $messages]);

} catch(PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de la récupération des messages']);
}
