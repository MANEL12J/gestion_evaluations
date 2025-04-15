<?php
require "config.php"; // Inclure la connexion à la base de données

session_start();

// Vérifier que l'utilisateur est un professeur
if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'enseignant') {
    echo json_encode(['success' => false, 'message' => 'Accès non autorisé']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Récupérer les données JSON envoyées via POST
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'Évaluation non trouvée']);
    exit;
}

$eval_id = $data['id'];

// Vérifier si l'évaluation appartient à l'utilisateur
$query = "DELETE FROM evaluations WHERE id = ? AND createur_id = ?";
$stmt = $pdo->prepare($query);
$stmt->execute([$eval_id, $user_id]);

if ($stmt->rowCount() > 0) {
    echo json_encode(['success' => true, 'message' => 'Évaluation supprimée']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
}
?>
