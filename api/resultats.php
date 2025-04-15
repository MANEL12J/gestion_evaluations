<?php
require '../api/db.php';
require '../api/session.php';
checkSession();

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $etudiant_id = $_SESSION['user_id'];
    $stmt = $pdo->prepare("SELECT * FROM resultats WHERE etudiant_id = ?");
    $stmt->execute([$etudiant_id]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}
?>
