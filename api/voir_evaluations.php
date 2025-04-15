<?php
require "config.php";
header("Content-Type: application/json");

try {
    $stmt = $pdo->query("SELECT * FROM evaluations ORDER BY date_evaluation DESC");
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "evaluations" => $evaluations]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur SQL : " . $e->getMessage()]);
}
?>
