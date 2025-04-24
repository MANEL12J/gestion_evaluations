<?php
// API pour envoyer un mail de notification à tous les étudiants d'un niveau donné
require_once 'config.php';
header('Content-Type: application/json');

// Sécurité : uniquement POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['niveau'], $data['module'], $data['date_evaluation'], $data['heure_evaluation'])) {
    echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
    exit;
}

$niveau = $data['niveau'];
$module = $data['module'];
$date_eval = $data['date_evaluation'];
$heure_eval = $data['heure_evaluation'];

// Récupérer les emails des étudiants du niveau
$stmt = $pdo->prepare('SELECT email, nom FROM utilisateurs WHERE type = ? AND niveau = ?');
$stmt->execute(['etudiant', $niveau]);
$etudiants = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!$etudiants) {
    echo json_encode(['success' => false, 'message' => 'Aucun étudiant trouvé pour ce niveau']);
    exit;
}

$subject = "Nouvelle Evaluation a venir";
$message = "Cher étudiant,\n\nVous avez une nouvelle évaluation dans le module $module prévue le $date_eval à $heure_eval.\n\nMerci de consulter la plateforme pour plus de détails.\n\nBonne chance !";
$headers = "From: noreply@gestion-evaluations.local\r\nContent-Type: text/plain; charset=utf-8";

// Utilisation de PHPMailer pour l'envoi via Gmail
require_once __DIR__ . '/../vendor/PHPMailer/src/Exception.php';
require_once __DIR__ . '/../vendor/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../vendor/PHPMailer/src/SMTP.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$successCount = 0;
foreach ($etudiants as $etud) {
    $to = $etud['email'];
    $body_html = "<div style='font-family: Arial, sans-serif; font-size: 15px;'>"
        . "<p>Bonjour <b>" . htmlspecialchars($etud['nom']) . "</b>,</p>"
        . "<p style='margin-bottom:12px;'>Vous avez une <b style='color:#2d7be5;'>nouvelle évaluation</b> !</p>"
        . "<ul style='margin:0 0 16px 0; padding-left:18px;'>"
        . "<li><b>Module :</b> <span style='color:#222;'>" . htmlspecialchars($module) . "</span></li>"
        . "<li><b>Date :</b> <span style='color:#222;'>" . htmlspecialchars($date_eval) . "</span></li>"
        . "<li><b>Heure :</b> <span style='color:#222;'>" . htmlspecialchars($heure_eval) . "</span></li>"
        . "</ul>"
        . "<p style='margin-bottom:12px;'>Merci de consulter la plateforme pour plus de détails.<br>Bonne chance !</p>"
        . "<hr style='border:none; border-top:1px solid #e4e4e4; margin:24px 0 12px 0;'>"
        . "<div style='font-size:13px;color:#888;'>Ceci est un message automatique de la plateforme <b>Gestion Evaluations</b>.</div>"
        . "</div>";
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'manelbensalah95@gmail.com';
        $mail->Password = 'jayu sqtj mvyr dpmi'; // Mot de passe d'application Gmail
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        $mail->setFrom('manelbensalah95@gmail.com', 'Gestion Evaluations');
        $mail->addAddress($to, $etud['nom']);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body_html;
        $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</li>', '</ul>', '</p>'], "\n", $body_html));
        $mail->send();
        $successCount++;
    } catch (Exception $e) {
        // On peut logger $mail->ErrorInfo si besoin
    }
}

if ($successCount > 0) {
    echo json_encode(['success' => true, 'sent' => $successCount]);
} else {
    echo json_encode(['success' => false, 'message' => 'Aucun mail envoyé']);
}

