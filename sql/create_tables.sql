CREATE DATABASE IF NOT EXISTS gestion_evaluations;
USE gestion_evaluations;

-- Table : utilisateurs
CREATE TABLE utilisateurs (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    niveau VARCHAR(10) DEFAULT NULL
);

-- Table : evaluations
CREATE TABLE evaluations (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    date_evaluation DATE NOT NULL,
    heure_evaluation TIME NOT NULL,
    duree_evaluation INT(11) NOT NULL,
    createur_id INT(11) NOT NULL,
    niveau ENUM('L1', 'L2', 'L3') NOT NULL,
    semestre ENUM('Semestre 1', 'Semestre 2') NOT NULL,
    module VARCHAR(100) NOT NULL,
    archive TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (createur_id) REFERENCES utilisateurs(id)
);



-- Table : messages
CREATE TABLE messages (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    sender_id INT(11) NOT NULL,
    receiver_id INT(11) NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (sender_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (receiver_id) REFERENCES utilisateurs(id)
);

-- Table : questions
CREATE TABLE questions (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_evaluation INT(11) NOT NULL,
    question TEXT NOT NULL,
    FOREIGN KEY (id_evaluation) REFERENCES evaluations(id)
);

-- Table : reponses
CREATE TABLE reponses (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_question INT(11) NOT NULL,
    texte TEXT NOT NULL,
    est_correct TINYINT(1) NOT NULL,
    FOREIGN KEY (id_question) REFERENCES questions(id)
);

-- Table : soumissions
CREATE TABLE soumissions (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    evaluation_id INT(11) NOT NULL,
    etudiant_id INT(11) NOT NULL,
    note FLOAT NOT NULL,
    temps_restant INT(11) NOT NULL,
    date_soumission DATETIME NOT NULL,
    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id),
    FOREIGN KEY (etudiant_id) REFERENCES utilisateurs(id)
);

CREATE VIEW evaluations_details AS
SELECT
    e.id,
    e.titre,
    e.date_evaluation,
    e.heure_evaluation,
    e.duree_evaluation,
    e.niveau,
    e.semestre,
    e.module,
    e.createur_id,
    u.nom AS nom_createur
FROM evaluations e
JOIN utilisateurs u ON e.createur_id = u.id;
