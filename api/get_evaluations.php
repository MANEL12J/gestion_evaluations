<?php
require "config.php"; // Inclure la connexion à la base de données
session_start();

// Logs pour le débogage
error_log('Session user_type: ' . (isset($_SESSION['user_type']) ? $_SESSION['user_type'] : 'non défini'));
error_log('Session user_id: ' . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'non défini'));

// Vérifier que l'utilisateur est un professeur (insensible à la casse)
if (!isset($_SESSION['user_id']) || strtolower($_SESSION['user_type']) !== 'enseignant') {
    echo json_encode(['success' => false, 'message' => 'Accès non autorisé', 'debug' => [
        'user_type' => isset($_SESSION['user_type']) ? $_SESSION['user_type'] : null,
        'user_id' => isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null
    ]]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Log pour le débogage
error_log('Recherche des évaluations pour user_id: ' . $user_id);

// Vérifier si la table existe
$checkQuery = "SHOW TABLES LIKE 'evaluations'";
$tableExists = $pdo->query($checkQuery)->rowCount() > 0;

if (!$tableExists) {
    error_log('La table evaluations nexiste pas!');
    echo json_encode(['success' => false, 'message' => 'Table non trouvée']);
    exit;
}

// Préparer et exécuter la requête
$query = "SELECT id, titre, date_evaluation, heure_evaluation, duree_evaluation, niveau, semestre, module, createur_id FROM evaluations WHERE createur_id = :user_id AND archive = 0 ORDER BY date_evaluation DESC, heure_evaluation DESC";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
$stmt->execute();

// Récupérer les résultats
$evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Log du nombre d'évaluations
error_log('Nombre dévaluations trouvées: ' . count($evaluations));

// Retourner les résultats avec debug
echo json_encode([
    'success' => true,
    'evaluations' => $evaluations,
    'debug' => [
        'user_id' => $user_id,
        'table_exists' => $tableExists,
        'eval_count' => count($evaluations)
    ]
]);
exit;
?>
