<?php
// Script à appeler manuellement ou par cron pour envoyer les rappels d'évaluation (1 jour avant et 1h avant)
require_once 'config.php';
header('Content-Type: application/json');

$now = new DateTime();
$now_date = $now->format('Y-m-d');
$now_time = $now->format('H:i');

// Récupérer toutes les évaluations à venir (aujourd'hui ou demain)
$stmt = $pdo->query("SELECT id, titre, date_evaluation, heure_evaluation, niveau, module FROM evaluations WHERE date_evaluation >= CURDATE()");
$evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

$sent = ["1day" => 0, "1hour" => 0];
foreach ($evaluations as $eval) {
    $date_eval = $eval['date_evaluation'];
    $heure_eval = $eval['heure_evaluation'];
    $niveau = $eval['niveau'];
    $module = $eval['module'];
    $titre = $eval['titre'];

    // 1. Rappel 1 jour avant
    $date_jour_avant = (new DateTime($date_eval))->modify('-1 day')->format('Y-m-d');
    if ($now_date === $date_jour_avant && $now_time >= '07:00' && $now_time <= '23:59') {
        $sent['1day'] += send_reminder($pdo, $niveau, $module, $titre, $date_eval, $heure_eval, '1day');
    }
    // 2. Rappel 1 heure avant
    if ($now_date === $date_eval) {
        $heure_eval_dt = DateTime::createFromFormat('H:i', $heure_eval);
        $heure_une_heure_avant = $heure_eval_dt ? $heure_eval_dt->modify('-1 hour')->format('H:i') : null;
        if ($heure_une_heure_avant && $now_time >= $heure_une_heure_avant && $now_time < $heure_eval) {
            $sent['1hour'] += send_reminder($pdo, $niveau, $module, $titre, $date_eval, $heure_eval, '1hour');
        }
    }
}

echo json_encode(["success" => true, "sent" => $sent]);

function send_reminder($pdo, $niveau, $module, $titre, $date_eval, $heure_eval, $type) {
    $stmt = $pdo->prepare('SELECT email, nom FROM utilisateurs WHERE type = ? AND niveau = ?');
    $stmt->execute(['etudiant', $niveau]);
    $etudiants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!$etudiants) return 0;

    if ($type === '1day') {
        $subject = "Rappel : Évaluation demain ($module)";
        $message = "Cher étudiant,\n\nRappel : Vous avez une évaluation dans le module $module prévue demain ($date_eval) à $heure_eval.\n\nSoyez prêt !";
    } else {
        $subject = "Rappel : Évaluation dans 1 heure ($module)";
        $message = "Cher étudiant,\n\nRappel : Votre évaluation dans le module $module commence dans 1 heure (à $heure_eval).\n\nBonne chance !";
    }
    // PHPMailer pour Gmail
    require_once __DIR__ . '/../vendor/PHPMailer/src/Exception.php';
    require_once __DIR__ . '/../vendor/PHPMailer/src/PHPMailer.php';
    require_once __DIR__ . '/../vendor/PHPMailer/src/SMTP.php';
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;
    $count = 0;
    foreach ($etudiants as $etud) {
        $to = $etud['email'];
        $body_html = "<div style='font-family: Arial, sans-serif; font-size: 15px;'>"
            . "<p>Bonjour <b>" . htmlspecialchars($etud['nom']) . "</b>,</p>";
        if ($type === '1day') {
            $body_html .= "<p style='margin-bottom:12px;'><b style='color:#e67e22;'>Rappel :</b> Vous avez une évaluation <b>demain</b> !</p>";
        } else {
            $body_html .= "<p style='margin-bottom:12px;'><b style='color:#e74c3c;'>Rappel :</b> Votre évaluation commence dans <b>1 heure</b> !</p>";
        }
        $body_html .= "<ul style='margin:0 0 16px 0; padding-left:18px;'>"
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
            $count++;
        } catch (Exception $e) {
            // Optionnel : log $mail->ErrorInfo
        }
    }
    return $count;
}
