<?php
// Test d'envoi d'un mail via Gmail avec PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once '../vendor/PHPMailer/src/Exception.php';
require_once '../vendor/PHPMailer/src/PHPMailer.php';
require_once '../vendor/PHPMailer/src/SMTP.php';

$mail = new PHPMailer(true);

try {
    // Paramètres serveur Gmail
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'manelbensalah95@gmail.com'; // Ton email Gmail
    $mail->Password = 'jayu sqtj mvyr dpmi'; // Mot de passe d'application Gmail
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    // Destinataire
    $mail->setFrom('manelbensalah95@gmail.com', 'Test XAMPP');
    $mail->addAddress('manelbensalah95@gmail.com'); // Email de destination

    // Contenu
    $mail->isHTML(false);
    $mail->Subject = 'Test PHPMailer via Gmail';
    $mail->Body    = "Bravo, ça marche avec PHPMailer et Gmail !";

    $mail->send();
    echo 'Mail envoyé avec succès !';
} catch (Exception $e) {
    echo "Erreur lors de l'envoi du mail : {$mail->ErrorInfo}";
}
?>
