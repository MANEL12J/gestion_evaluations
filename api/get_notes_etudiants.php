<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

try {
    // Vérifier que l'utilisateur est connecté et est un professeur
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'enseignant') {
        throw new Exception('Accès non autorisé');
    }

    $sql = "SELECT 
                e.titre as evaluation_titre,
                e.date_evaluation,
                e.niveau,
                e.semestre,
                e.module,
                u.nom as etudiant_nom,
                s.note,
                s.date_soumission
            FROM soumissions s
            INNER JOIN evaluations e ON s.evaluation_id = e.id
            INNER JOIN utilisateurs u ON s.etudiant_id = u.id
            WHERE e.createur_id = :prof_id
            ORDER BY e.date_evaluation DESC, e.titre ASC, u.nom ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['prof_id' => $_SESSION['user_id']]);
    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'notes' => $notes
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
