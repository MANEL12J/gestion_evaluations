<?php
session_start();
require 'config.php';
header('Content-Type: application/json');

// Vérifier si l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

try {
    // Récupérer le niveau spécifié ou tous les niveaux si non spécifié
    $niveau = isset($_GET['niveau']) ? $_GET['niveau'] : null;
    
    $sql = "
        SELECT 
            e.titre,
            e.niveau,
            e.module,
            s.note,
            DATE_FORMAT(s.date_soumission, '%d/%m/%Y') as date_soumission
        FROM soumissions s
        JOIN evaluations e ON s.evaluation_id = e.id
        WHERE s.etudiant_id = ?
    ";
    
    $params = [$_SESSION['user_id']];
    
    if ($niveau) {
        $sql .= " AND e.niveau = ?";
        $params[] = $niveau;
    }
    
    $sql .= " ORDER BY e.niveau, e.module, s.date_soumission DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'notes' => $notes
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => "Erreur lors de la récupération des notes : " . $e->getMessage()
    ]);
}
?>
