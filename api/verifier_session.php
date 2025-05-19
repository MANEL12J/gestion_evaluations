<?php
session_start();
header("Content-Type: application/json");

// Debug: Afficher toutes les variables de session
error_log("SESSION: " . print_r($_SESSION, true));

if (!isset($_SESSION['user_id'])) {
    error_log("Erreur: user_id non défini dans la session");
    echo json_encode([
        "status" => "error", 
        "message" => "Utilisateur non connecté",
        "debug" => "user_id manquant"
    ]);
    exit;
}

if (!isset($_SESSION['user_type'])) {
    error_log("Erreur: user_type non défini dans la session");
    echo json_encode([
        "status" => "error", 
        "message" => "Type d'utilisateur non défini",
        "debug" => "user_type manquant"
    ]);
    exit;
}

error_log("Succès: user_id=" . $_SESSION['user_id'] . ", user_type=" . $_SESSION['user_type']);
echo json_encode([
    "status" => "success",
    "user_id" => $_SESSION['user_id'],
    "user_type" => $_SESSION['user_type'],
    "debug" => "session valide"
]);
?>
