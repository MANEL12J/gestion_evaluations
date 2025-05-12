<?php
require_once 'config.php';
session_start();

// Logs pour le débogage
error_log('Session user_type: ' . (isset($_SESSION['user_type']) ? $_SESSION['user_type'] : 'non défini'));
error_log('Session user_id: ' . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'non défini'));

// Vérifier si l'utilisateur est connecté et est un enseignant
if (!isset($_SESSION['user_id']) || strtolower($_SESSION['user_type']) !== 'enseignant') {
    echo json_encode([
        'success' => false, 
        'message' => 'Accès non autorisé',
        'debug' => [
            'user_type' => isset($_SESSION['user_type']) ? $_SESSION['user_type'] : null,
            'user_id' => isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null
        ]
    ]);
    exit;
}

// Récupérer les données POST
$data = json_decode(file_get_contents('php://input'), true);
$niveau = isset($data['niveau']) ? $data['niveau'] : '';
$module = isset($data['module']) ? $data['module'] : '';
$enseignant_id = $_SESSION['user_id'];

try {
    $query = "SELECT * FROM evaluations WHERE createur_id = :createur_id";
    $params = ['createur_id' => $enseignant_id];

    if (!empty($niveau)) {
        $query .= " AND niveau = :niveau";
        $params['niveau'] = $niveau;
    }

    if (!empty($module)) {
        $query .= " AND module = :module";
        $params['module'] = $module;
    }

    $query .= " ORDER BY niveau, date_evaluation DESC";

    error_log('Query: ' . $query);
    error_log('Params: ' . print_r($params, true));

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);

    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log('Nombre dévaluations trouvées: ' . count($evaluations));

    echo json_encode([
        'success' => true,
        'evaluations' => $evaluations,
        'debug' => [
            'query' => $query,
            'params' => $params,
            'count' => count($evaluations)
        ]
    ]);

} catch(PDOException $e) {
    error_log('Erreur SQL: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des évaluations',
        'debug' => $e->getMessage()
    ]);
}
?>
