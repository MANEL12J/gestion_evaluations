<?php
require "config.php";
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'etudiant') {
    echo json_encode(["status" => "error", "message" => "Accès non autorisé"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['evaluation_id'])) {
    echo json_encode(["status" => "error", "message" => "ID évaluation manquant"]);
    exit;
}

$evaluation_id = $data['evaluation_id'];
$etudiant_id = $_SESSION['user_id'];

try {
    // Compter les questions
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM questions WHERE evaluation_id = ?");
    $stmt->execute([$evaluation_id]);
    $total_questions = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    if ($total_questions == 0) {
        echo json_encode(["status" => "error", "message" => "Aucune question trouvée"]);
        exit;
    }

    // Récupérer les réponses de l'étudiant
    $stmt = $pdo->prepare("SELECT COUNT(*) as correct FROM reponses WHERE etudiant_id = ? AND question_id IN (SELECT id FROM questions WHERE evaluation_id = ?)");
    $stmt->execute([$etudiant_id, $evaluation_id]);
    $correct_answers = $stmt->fetch(PDO::FETCH_ASSOC)['correct'];

    // Calculer le score
    $score = ($correct_answers / $total_questions) * 100;

    // Enregistrer le résultat
    $stmt = $pdo->prepare("INSERT INTO resultats (score, evaluation_id, etudiant_id) VALUES (?, ?, ?)");
    $stmt->execute([$score, $evaluation_id, $etudiant_id]);

    echo json_encode(["status" => "success", "message" => "Résultat calculé", "score" => $score]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur lors du calcul"]);
}
?>
