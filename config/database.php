<?php
try {
    $host = 'localhost';
    $dbname = 'gestion_evaluations';
    $username = 'root';
    $password = '';
    
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    error_log('Database connection error: ' . $e->getMessage());
    throw $e;
}
