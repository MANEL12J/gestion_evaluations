<?php
// API pour récupérer le niveau de l'utilisateur connecté
require_once 'config.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_type'])) {
    echo json_encode(['success' => false, 'message' => 'Utilisateur non connecté']);
    exit;
}

$user_id = $_SESSION['user_id'];
$user_type = $_SESSION['user_type'];

try {
    $stmt = $pdo->prepare('SELECT niveau FROM utilisateurs WHERE id = ?');
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user && $user['niveau']) {
        echo json_encode(['success' => true, 'niveau' => $user['niveau']]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Niveau non trouvé']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur : ' . $e->getMessage()]);
}
