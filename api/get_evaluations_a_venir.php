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
        WHERE CONCAT(e.date_evaluation, ' ', e.heure_evaluation) > NOW()
        AND e.archive = 0
    ";
    
    if ($niveau) {
        $sql .= " AND e.niveau = ?";
    }
    
    $sql .= " ORDER BY e.date_evaluation ASC, e.heure_evaluation ASC";
    
    $stmt = $pdo->prepare($sql);
    
    if ($niveau) {
        $stmt->execute([$niveau]);
    } else {
        $stmt->execute();
    }
    
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'evaluations' => $evaluations
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => "Erreur lors de la récupération des évaluations à venir : " . $e->getMessage()
    ]);
}
?>
