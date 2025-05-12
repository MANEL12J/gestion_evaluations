<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
require "config.php";

require_once "config.php";
// Database connection is already established in config.php, $pdo is available

header('Content-Type: application/json');

// Debug logging
error_log('Session data: ' . print_r($_SESSION, true));

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non autorisé']);
    exit;
}

$search = isset($_GET['search']) ? $_GET['search'] : '';
$current_user_type = isset($_SESSION['user_type']) ? strtolower($_SESSION['user_type']) : '';

error_log('Current user type: ' . $current_user_type);

// Définir le type d'utilisateur à rechercher
if ($current_user_type === 'enseignant') {
    $search_user_type = 'etudiant';
} elseif ($current_user_type === 'etudiant') {
    $search_user_type = 'enseignant';
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Type utilisateur invalide', 'debug' => $current_user_type]);
    exit;
}

try {
    if (empty($search)) {
        // Get only users with existing conversations
        $query = "
            SELECT DISTINCT u.id, u.nom, u.email, u.type,
            (SELECT COUNT(*) FROM messages 
             WHERE sender_id = u.id 
             AND receiver_id = :current_user_id 
             AND is_read = 0
            ) as unread_count
            FROM utilisateurs u
            INNER JOIN messages m ON 
                (m.sender_id = u.id OR m.receiver_id = u.id) AND
                (m.sender_id = :current_user_id OR m.receiver_id = :current_user_id)
            WHERE u.id != :current_user_id
            GROUP BY u.id
            ORDER BY MAX(m.timestamp) DESC
        ";
    } else {
        // Search all users for new conversations
        $query = "
            SELECT u.id, u.nom, u.email, u.type,
            (SELECT COUNT(*) FROM messages WHERE 
                ((sender_id = u.id AND receiver_id = :current_user_id) OR 
                 (sender_id = :current_user_id AND receiver_id = u.id))
            ) as has_conversation,
            (SELECT COUNT(*) FROM messages 
             WHERE sender_id = u.id 
             AND receiver_id = :current_user_id 
             AND is_read = 0
            ) as unread_count
            FROM utilisateurs u
            WHERE u.id != :current_user_id
            AND u.type = :search_user_type
            AND u.nom LIKE :search
            ORDER BY has_conversation DESC, u.nom ASC
        ";
    }

    error_log('Search query: ' . $query);
    error_log('Search params: type=' . $search_user_type . ', search=' . $search);

    $stmt = $pdo->prepare($query);
    $params = [
        ':current_user_id' => $_SESSION['user_id']
    ];

    if (!empty($search)) {
        $params[':search_user_type'] = $search_user_type;
        $params[':search'] = '%' . $search . '%';
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    error_log('Found users: ' . print_r($users, true));

    echo json_encode([
        'success' => true,
        'users' => $users,
        'debug' => [
            'current_user_type' => $current_user_type,
            'search_user_type' => $search_user_type,
            'search_term' => $search
        ]
    ]);
} catch(PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur lors de la recherche des utilisateurs',
        'debug' => $e->getMessage()
    ]);
}
