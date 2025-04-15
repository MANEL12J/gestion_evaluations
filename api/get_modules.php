<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

try {
    // Vérifier que l'utilisateur est connecté
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Utilisateur non connecté');
    }

    // Récupérer les paramètres
    $niveau = isset($_GET['niveau']) ? $_GET['niveau'] : '';
    $semestre = isset($_GET['semestre']) ? $_GET['semestre'] : '';

    // Construire la requête SQL
    $sql = "SELECT DISTINCT module FROM evaluations WHERE 1=1";
    $params = [];

    if ($niveau) {
        $sql .= " AND niveau = ?";
        $params[] = $niveau;
    }

    if ($semestre) {
        $sql .= " AND semestre = ?";
        $params[] = $semestre;
    }

    $sql .= " ORDER BY module";

    // Exécuter la requête
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $modules = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'modules' => $modules
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
