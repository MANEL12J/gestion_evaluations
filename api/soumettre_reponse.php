<?php
include 'config.php';
session_start();

$data = json_decode(file_get_contents("php://input"), true);
$evaluation_id = $data['evaluation_id'];
$reponses = $data['reponses'];

foreach ($reponses as $reponse) {
    $question_id = $reponse['question_id'];
    $contenu = $reponse['contenu'];

    $sql = "INSERT INTO reponses (question_id, evaluation_id, contenu) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iis", $question_id, $evaluation_id, $contenu);
    $stmt->execute();
}

echo json_encode(["status" => "success", "message" => "Réponses enregistrées"]);
?>
