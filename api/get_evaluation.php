<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

try {
    // Vérifier que l'utilisateur est connecté
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Utilisateur non connecté');
    }

    // Vérifier que l'ID de l'évaluation est fourni
    if (!isset($_GET['id'])) {
        throw new Exception('ID de l\'évaluation non fourni');
    }

    $evaluation_id = $_GET['id'];
    $user_id = $_SESSION['user_id'];

    // Récupérer l'évaluation
    $stmt = $pdo->prepare("
        SELECT 
            e.id,
            e.titre,
            e.date_evaluation,
            e.heure_evaluation,
            e.duree_evaluation,
            e.niveau,
            e.semestre,
            e.module
        FROM evaluations e
        WHERE e.id = ?
    ");
    $stmt->execute([$evaluation_id]);
    $evaluation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$evaluation) {
        throw new Exception('Évaluation non trouvée');
    }

    // Récupérer les questions
    $stmt = $pdo->prepare("
        SELECT 
            q.id,
            q.question as texte
        FROM questions q
        WHERE q.id_evaluation = ?
    ");
    $stmt->execute([$evaluation_id]);
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Récupérer les réponses pour chaque question
    foreach ($questions as &$question) {
        $stmt = $pdo->prepare("
            SELECT 
                id,
                texte,
                est_correct
            FROM reponses 
            WHERE id_question = ?
        ");
        $stmt->execute([$question['id']]);
        $question['reponses'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    $evaluation['questions'] = $questions;

    echo json_encode([
        'success' => true,
        'evaluation' => $evaluation
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>