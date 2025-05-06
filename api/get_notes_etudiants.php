<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

try {
    // Vérifier que l'utilisateur est connecté et est un professeur
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'enseignant') {
        throw new Exception('Accès non autorisé');
    }

    // D'abord, récupérer les évaluations
    $queryEvals = "SELECT DISTINCT e.id, e.titre as evaluation_titre, e.niveau, e.module, e.semestre 
                  FROM evaluations e 
                  WHERE e.createur_id = :prof_id";

    $params = ['prof_id' => $_SESSION['user_id']];

    // Ajouter les filtres pour les évaluations
    if (isset($_GET['niveau']) && !empty($_GET['niveau'])) {
        $queryEvals .= " AND e.niveau = :niveau";
        $params['niveau'] = $_GET['niveau'];
    }

    if (isset($_GET['semestre']) && !empty($_GET['semestre'])) {
        $queryEvals .= " AND e.semestre = :semestre";
        $params['semestre'] = urldecode($_GET['semestre']);
    }

    if (isset($_GET['module']) && !empty($_GET['module'])) {
        $queryEvals .= " AND e.module = :module";
        $params['module'] = $_GET['module'];
    }

    $queryEvals .= " ORDER BY e.titre ASC";

    $stmt = $pdo->prepare($queryEvals);
    $stmt->execute($params);
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Pour chaque évaluation, récupérer ses notes
    $result = [];
    foreach ($evaluations as $eval) {
        $queryNotes = "SELECT s.*, u.nom as etudiant_nom 
                      FROM soumissions s
                      JOIN utilisateurs u ON s.etudiant_id = u.id
                      WHERE s.evaluation_id = :eval_id
                      ORDER BY u.nom ASC";
        
        $stmt = $pdo->prepare($queryNotes);
        $stmt->execute(['eval_id' => $eval['id']]);
        $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result[] = [
            'evaluation' => $eval,
            'notes' => $notes
        ];
    }

    echo json_encode([
        'success' => true,
        'evaluations' => $result
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
