<?php
session_start();
header("Content-Type: application/json");

require 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Utilisateur non connecté"]);
    exit;
}

// Récupérer les paramètres de filtrage
$niveau = isset($_GET['niveau']) ? $_GET['niveau'] : '';
$module = isset($_GET['module']) ? $_GET['module'] : '';

// Vérifier le niveau seulement s'il est spécifié
if ($niveau !== '' && !in_array($niveau, ['L1', 'L2', 'L3'])) {
    echo json_encode(["success" => false, "message" => "Niveau invalide"]);
    exit;
}

try {
    // Récupérer les évaluations non passées du parcours spécifié
    // Construire la requête SQL avec les filtres
    $sql = "
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
        WHERE (
            -- Évaluations à venir
            CONCAT(e.date_evaluation, ' ', e.heure_evaluation) > NOW()
            OR
            -- Évaluations en cours (pendant leur durée)
            (CONCAT(e.date_evaluation, ' ', e.heure_evaluation) <= NOW()
             AND DATE_ADD(CONCAT(e.date_evaluation, ' ', e.heure_evaluation), 
                         INTERVAL e.duree_evaluation MINUTE) >= NOW())
        )
        AND NOT EXISTS (
            SELECT 1 FROM soumissions s
            WHERE s.evaluation_id = e.id
            AND s.etudiant_id = ?
        )
        AND e.archive = 0";

    $params = [$_SESSION['user_id']];

    // Ajouter le filtre par niveau si spécifié
    if ($niveau !== '') {
        $sql .= " AND e.niveau = ?";
        $params[] = $niveau;
    }

    // Ajouter le filtre par module si spécifié
    if ($module !== '') {
        $sql .= " AND e.module = ?";
        $params[] = $module;
    }

    $sql .= " ORDER BY e.date_evaluation ASC, e.heure_evaluation ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "evaluations" => $evaluations
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Erreur lors de la récupération des évaluations : " . $e->getMessage()
    ]);
}
?>
