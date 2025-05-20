<?php
session_start();
require 'config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

try {
    $niveau = isset($_GET['niveau']) ? $_GET['niveau'] : null;
    $module = isset($_GET['module']) ? $_GET['module'] : null;
    $etudiant_id = $_SESSION['user_id'];

    $sql = "
        SELECT 
            e.id,
            e.titre,
            e.module,
            e.niveau,
            e.semestre,
            e.date_evaluation,
            e.heure_evaluation,
            e.duree_evaluation
        FROM evaluations e
        WHERE DATE_ADD(
            CONCAT(e.date_evaluation, ' ', e.heure_evaluation),
            INTERVAL e.duree_evaluation MINUTE
        ) < NOW()
        AND NOT EXISTS (
            SELECT 1 
            FROM soumissions s 
            WHERE s.evaluation_id = e.id 
            AND s.etudiant_id = ?
        )
        AND e.archive = 0
    ";
    
    $params = [$etudiant_id];
    
    if ($niveau) {
        $sql .= " AND e.niveau = ?";
        $params[] = $niveau;
    }
    
    if ($module) {
        $sql .= " AND e.module = ?";
        $params[] = $module;
    }
    
    $sql .= " ORDER BY e.date_evaluation DESC, e.heure_evaluation DESC";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'evaluations' => $evaluations
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la récupération des évaluations : ' . $e->getMessage()
        ]);
    }

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => "Erreur lors de la récupération des évaluations ratées : " . $e->getMessage()
    ]);
}
?>
