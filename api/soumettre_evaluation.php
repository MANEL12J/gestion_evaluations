<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

try {
    // Vérifier que les données sont du JSON valide
    $json = file_get_contents('php://input');
    if ($json === false) {
        throw new Exception("Impossible de lire les données envoyées");
    }
    
    $data = json_decode($json, true);
    if ($data === null) {
        throw new Exception("JSON invalide: " . json_last_error_msg());
    }
    
    // Vérifier les champs requis
    if (!isset($data['evaluation_id'])) {
        throw new Exception("L'ID de l'évaluation est manquant");
    }
    if (!isset($data['reponses']) || !is_array($data['reponses'])) {
        throw new Exception("Les réponses sont manquantes ou invalides");
    }
    
    $evaluation_id = intval($data['evaluation_id']);
    $reponses = $data['reponses'];
    $temps_restant = isset($data['temps_restant']) ? intval($data['temps_restant']) : 0;
    
    // Récupérer les réponses correctes
    $note = 0;
    $total_questions = count($reponses);
    
    // Vérifier si l'utilisateur est connecté
    if (!isset($_SESSION['user_id'])) {
        throw new Exception("Vous devez être connecté pour soumettre une évaluation");
    }

    foreach ($reponses as $reponse) {
        if (!isset($reponse['question_id']) || !isset($reponse['reponses']) || !is_array($reponse['reponses'])) {
            throw new Exception("Format de réponse invalide pour la question");
        }

        $question_id = intval($reponse['question_id']);
        $reponses_selectionnees = array_map('intval', $reponse['reponses']);
        
        // Récupérer toutes les réponses pour cette question
        $stmt = $pdo->prepare("SELECT id, texte, est_correct FROM reponses WHERE id_question = ?");
        $stmt->execute([$question_id]);
        
        $reponses_correctes = [];
        $total_reponses = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $total_reponses[$row['id']] = $row;
            if ($row['est_correct']) {
                $reponses_correctes[] = $row['id'];
            }
        }
        
        if (empty($reponses_correctes)) {
            throw new Exception("Aucune réponse correcte trouvée pour la question $question_id");
        }
        
        error_log("Question $question_id:");
        error_log("- Réponses correctes: " . implode(", ", $reponses_correctes));
        error_log("- Réponses sélectionnées: " . implode(", ", $reponses_selectionnees));
        
        // Calcul du score pour cette question
        $score_question = 0;
        $points_par_reponse = 1 / count($reponses_correctes); // Diviser les points également entre les bonnes réponses
        
        // Points pour les réponses sélectionnées
        foreach ($reponses_selectionnees as $rep) {
            if (isset($total_reponses[$rep])) {
                if ($total_reponses[$rep]['est_correct']) {
                    $score_question += $points_par_reponse;
                    error_log("  + $points_par_reponse point pour la réponse correcte $rep");
                } else {
                    $score_question -= $points_par_reponse; // Pénalité pour réponse incorrecte
                    error_log("  - $points_par_reponse point pour la réponse incorrecte $rep");
                }
            }
        }
        
        // S'assurer que le score n'est pas négatif
        $score_question = max(0, $score_question);
        $note += $score_question;
        
        error_log("  => Score question: $score_question");
        error_log("  => Note totale: $note");
    }
    
    // Calculer la note sur 20
    $note = ($note / $total_questions) * 20;
    
    // Enregistrer la soumission
    $etudiant_id = $_SESSION['user_id'];
    $stmt = $pdo->prepare("INSERT INTO soumissions (evaluation_id, etudiant_id, note, temps_restant, date_soumission) VALUES (?, ?, ?, ?, NOW())");
    $stmt->execute([$evaluation_id, $etudiant_id, $note, $temps_restant]);
    
    echo json_encode([
        'success' => true,
        'note' => $note
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
