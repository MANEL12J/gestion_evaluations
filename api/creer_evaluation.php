<?php
session_start();
header("Content-Type: application/json");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Utilisateur non connecté."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (
    empty($data["titre"])  || empty($data["date_evaluation"]) 
    || empty($data["heure_evaluation"]) || empty($data["duree_evaluation"]) || empty($data["questions"])
    || empty($data["niveau"]) || empty($data["semestre"]) || empty($data["module"])
) {
    echo json_encode(["success" => false, "message" => "Champs manquants."]);
    exit;
}

$titre = $data["titre"];
$date_evaluation = $data["date_evaluation"];
$heure_evaluation = $data["heure_evaluation"];
$duree_evaluation = $data["duree_evaluation"];
$questions = $data["questions"];
$niveau = $data["niveau"];
$semestre = $data["semestre"];
$module = $data["module"];
$createur_id = $_SESSION['user_id'];

// Vérification du niveau
if (!in_array($niveau, ['L1', 'L2', 'L3'])) {
    echo json_encode(["success" => false, "message" => "Niveau invalide."]);
    exit;
}

// Vérification du semestre
if (!in_array($semestre, ['Semestre 1', 'Semestre 2'])) {
    echo json_encode(["success" => false, "message" => "Semestre invalide."]);
    exit;
}

// Assure-toi que la variable $pdo est utilisée pour la connexion
try {
    $pdo->beginTransaction();
    

    // Insertion de l'évaluation
    $stmt = $pdo->prepare("INSERT INTO evaluations (titre, date_evaluation, heure_evaluation, duree_evaluation, niveau, semestre, module, createur_id) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$titre, $date_evaluation, $heure_evaluation, $duree_evaluation, $niveau, $semestre, $module, $createur_id]);
    $evaluation_id = $pdo->lastInsertId(); // Récupère l'ID de l'évaluation insérée

    // Insertion des questions + réponses
    foreach ($questions as $q) {
        $question_text = $q["question"];
        $stmt = $pdo->prepare("INSERT INTO questions (id_evaluation, question) VALUES (?, ?)");
        $stmt->execute([$evaluation_id, $question_text]);
        $question_id = $pdo->lastInsertId(); // Récupère l'ID de la question insérée

        foreach ($q["reponses"] as $r) {
            $texte = $r["texte"];
            $correct = $r["correct"];
            $stmt = $pdo->prepare("INSERT INTO reponses (id_question, texte, est_correct) VALUES (?, ?, ?)");
            $stmt->execute([$question_id, $texte, $correct]);
        }
    }

    $pdo->commit(); // Valide la transaction

    // Appel API pour notification immédiate
    $notificationUrl = $_SERVER['REQUEST_SCHEME']. '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['SCRIPT_NAME']) . '/send_evaluation_notification.php';
    $payload = [
        'niveau' => $niveau,
        'module' => $module,
        'date_evaluation' => $date_evaluation,
        'heure_evaluation' => $heure_evaluation
    ];
    $ch = curl_init($notificationUrl);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $response = curl_exec($ch);
    curl_close($ch);

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    $pdo->rollBack(); // Annule la transaction en cas d'erreur
    echo json_encode(["success" => false, "message" => "Erreur : " . $e->getMessage()]);
}
?>
