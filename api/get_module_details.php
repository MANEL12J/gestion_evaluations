<?php
require "config.php";
header('Content-Type: application/json');

if (!isset($_GET['prof_id']) || !isset($_GET['module']) || !isset($_GET['niveau']) || !isset($_GET['semestre'])) {
    echo json_encode(['success' => false, 'message' => 'Paramètres manquants.']);
    exit;
}

$prof_id = $_GET['prof_id'];
$module = $_GET['module'];
$niveau = $_GET['niveau'];
$semestre = $_GET['semestre'];

try {
    $query = "
        SELECT 
            e.titre,
            COUNT(DISTINCT s.etudiant_id) as nombre_etudiants,
            ROUND(COALESCE(AVG(s.note), 0), 2) as moyenne_classe
        FROM evaluations e
        LEFT JOIN soumissions s ON e.id = s.evaluation_id
        WHERE e.createur_id = :prof_id
          AND e.module = :module
          AND e.niveau = :niveau
          AND e.semestre = :semestre
        GROUP BY e.id, e.titre
        ORDER BY e.date_evaluation DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'prof_id' => $prof_id,
        'module' => $module,
        'niveau' => $niveau,
        'semestre' => $semestre
    ]);

    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'evaluations' => $evaluations]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Erreur de base de données: " . $e->getMessage()
    ]);
}
?>
