<?php
require "config.php";
session_start();
header('Content-Type: application/json');

try {
    // Compter le nombre d'étudiants
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM utilisateurs WHERE type = 'etudiant'");
    $stmt->execute();
    $etudiants = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Compter le nombre d'enseignants
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM utilisateurs WHERE type = 'enseignant'");
    $stmt->execute();
    $enseignants = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    echo json_encode([
        "success" => true,
        "stats" => [
            "etudiants" => $etudiants,
            "enseignants" => $enseignants
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Erreur lors de la récupération des statistiques: " . $e->getMessage()
    ]);
}
?>
