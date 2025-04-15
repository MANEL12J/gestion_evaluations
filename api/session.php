<?php
session_start();

function checkSession() {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(["status" => "error", "message" => "Non authentifié"]);
        exit();
    }
}
?>
