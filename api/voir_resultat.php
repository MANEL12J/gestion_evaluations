<?php
require "config.php";
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Accès non autorisé"]);
    exit;
}

$sql = "SELECT e.titre, AVG(r.note) AS score FROM evaluations e 
        JOIN reponses r ON e.id = r.evaluation_id 
        GROUP BY e.id";

$result = $conn->query($sql);
$resultats = [];

while ($row = $result->fetch_assoc()) {
    $resultats[] = ["titre" => $row['titre'], "score" => round($row['score'], 2)];
}

echo json_encode(["status" => "success", "resultats" => $resultats]);
?>
