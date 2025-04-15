<?php
require "config.php";
// Vérifier que l'ID de l'évaluation est fourni
if (!isset($_GET['evaluation_id'])) {
    echo json_encode(["status" => "error", "message" => "ID de l'évaluation manquant"]);
    exit;
}

$evaluation_id = intval($_GET['evaluation_id']);

// Récupérer les questions de l'évaluation
$sql = "SELECT id, texte, type FROM questions WHERE evaluation_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $evaluation_id);
$stmt->execute();
$result = $stmt->get_result();

$questions = [];
while ($row = $result->fetch_assoc()) {
    $questions[] = $row;
}

// Vérifier s'il y a des questions
if (count($questions) > 0) {
    echo json_encode(["status" => "success", "questions" => $questions]);
} else {
    echo json_encode(["status" => "error", "message" => "Aucune question trouvée"]);
}
?>
