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
            e.module,
            e.niveau,
            e.semestre,
            COUNT(DISTINCT s.etudiant_id) as nombre_etudiants,
            ROUND(AVG(s.note), 2) as moyenne_module
        FROM evaluations e
        JOIN soumissions s ON e.id = s.evaluation_id
        WHERE e.createur_id = :prof_id
        GROUP BY e.niveau, e.semestre, e.module
        ORDER BY e.niveau, e.semestre
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute(['prof_id' => $prof_id]);
    $modules_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Grouper les données par niveau
    $grouped = [
        'L1' => [],
        'L2' => [],
        'L3' => []
    ];
    
    foreach ($modules_data as $module) {
        if (isset($grouped[$module['niveau']])) {
            $grouped[$module['niveau']][] = $module;
        }
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
