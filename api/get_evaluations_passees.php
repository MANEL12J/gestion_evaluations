<?php
require_once 'config.php';

try {
    session_start();
    
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Utilisateur non connecté');
    }

    $user_id = $_SESSION['user_id'];
    $niveau = isset($_GET['niveau']) ? $_GET['niveau'] : null;
    $semestre = isset($_GET['semestre']) ? $_GET['semestre'] : null;
    $module = isset($_GET['module']) ? $_GET['module'] : null;

    $sql = "SELECT 
                e.id,
                e.titre,
                e.date_evaluation,
                e.heure_evaluation,
                e.duree_evaluation,
                e.niveau,
                e.semestre,
                e.module,
                s.note
            FROM evaluations e 
            INNER JOIN soumissions s ON e.id = s.evaluation_id 
            WHERE s.etudiant_id = :user_id";
    
    if ($niveau) {
        $sql .= " AND e.niveau = :niveau";
    }

    if ($semestre) {
        $sql .= " AND e.semestre = :semestre";
    }

    if ($module) {
        $sql .= " AND e.module = :module";
    }
    
    $sql .= " ORDER BY e.date_evaluation DESC, e.heure_evaluation DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    
    if ($niveau) {
        $stmt->bindParam(':niveau', $niveau, PDO::PARAM_STR);
    }

    if ($semestre) {
        $stmt->bindParam(':semestre', $semestre, PDO::PARAM_STR);
    }

    if ($module) {
        $stmt->bindParam(':module', $module, PDO::PARAM_STR);
    }
    
    $stmt->execute();
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'evaluations' => $evaluations
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
