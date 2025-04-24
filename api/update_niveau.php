<?php
// API pour mettre à jour le niveau de l'utilisateur connecté
require_once 'config.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'etudiant') {
    echo json_encode(['success' => false, 'message' => 'Non autorisé']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['niveau']) || !in_array($data['niveau'], ['L1','L2','L3'])) {
    echo json_encode(['success' => false, 'message' => 'Niveau invalide']);
    exit;
}

$user_id = $_SESSION['user_id'];
$nouveau_niveau = $data['niveau'];

try {
    $stmt = $pdo->prepare('UPDATE utilisateurs SET niveau = ? WHERE id = ?');
    $stmt->execute([$nouveau_niveau, $user_id]);
    echo json_encode(['success' => true, 'niveau' => $nouveau_niveau]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur : ' . $e->getMessage()]);
}
