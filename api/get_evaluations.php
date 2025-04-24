<?php
require "config.php"; // Inclure la connexion à la base de données
session_start();

// Vérifier que l'utilisateur est un professeur
if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'enseignant') {
    echo json_encode(['success' => false, 'message' => 'Accès non autorisé']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Préparer et exécuter la requête
$query = "SELECT id, titre, date_evaluation, heure_evaluation, duree_evaluation, niveau, semestre, module, createur_id FROM evaluations WHERE createur_id = :user_id AND archive = 0 ORDER BY date_evaluation DESC, heure_evaluation DESC";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
$stmt->execute();

// Récupérer les résultats avec fetchAll()
$evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Retourner les résultats en JSON
echo json_encode(['success' => true, 'evaluations' => $evaluations]);
exit;
?>
