<?php
require "config.php";
header('Content-Type: application/json');

// Récupérer la liste des professeurs
function get_professeurs() {
    global $pdo;
    $stmt = $pdo->prepare("SELECT id, nom FROM utilisateurs WHERE type = 'enseignant'");
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Récupérer les évaluations d'un professeur avec les moyennes, groupées par niveau
function get_evaluations_prof($prof_id) {
    global $pdo;
    $query = "
        SELECT 
            e.id,
            e.titre,
            e.niveau,
            e.semestre,
            e.module,
            COUNT(DISTINCT s.etudiant_id) as nombre_etudiants,
            ROUND(COALESCE(AVG(s.note), 0), 2) as moyenne_classe
        FROM evaluations e
        LEFT JOIN soumissions s ON e.id = s.evaluation_id
        WHERE e.createur_id = :prof_id
        GROUP BY e.id
        ORDER BY e.niveau, e.semestre, e.date_evaluation DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute(['prof_id' => $prof_id]);
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Grouper les évaluations par niveau
    $grouped = [
        'L1' => [],
        'L2' => [],
        'L3' => []
    ];
    
    foreach ($evaluations as $eval) {
        $grouped[$eval['niveau']][] = $eval;
    }
    
    return $grouped;
}

// Point d'entrée de l'API
if (isset($_GET['prof_id'])) {
    // Récupérer les évaluations d'un professeur spécifique
    $evaluations = get_evaluations_prof($_GET['prof_id']);
    echo json_encode([
        'success' => true,
        'evaluations' => $evaluations
    ]);
} else {
    // Récupérer la liste des professeurs
    $professeurs = get_professeurs();
    echo json_encode([
        'success' => true,
        'professeurs' => $professeurs
    ]);
}
?>
