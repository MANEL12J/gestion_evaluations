<?php
require_once 'config.php';
session_start();

// Vérifier si l'utilisateur est connecté et est un enseignant
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'enseignant') {
    echo json_encode(['success' => false, 'message' => 'Accès non autorisé']);
    exit;
}

// Récupérer les données POST
$data = json_decode(file_get_contents('php://input'), true);
$niveau = isset($data['niveau']) ? $data['niveau'] : '';
$module = isset($data['module']) ? $data['module'] : '';
$enseignant_id = $_SESSION['user_id'];

try {
    $query = "SELECT * FROM evaluations WHERE enseignant_id = ?";
    $params = [$enseignant_id];

    if (!empty($niveau)) {
        $query .= " AND niveau = ?";
        $params[] = $niveau;
    }

    if (!empty($module)) {
        $query .= " AND module = ?";
        $params[] = $module;
    }

    $query .= " ORDER BY niveau, date_evaluation DESC";

    $stmt = $conn->prepare($query);
    $stmt->execute($params);

    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'evaluations' => $evaluations
    ]);

} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des évaluations: ' . $e->getMessage()
    ]);
}

$conn = null;
?>
