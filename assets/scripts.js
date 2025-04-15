// Configuration de base
const API_URL = "http://localhost/gestion_evaluations/api/";

// Utilitaires
const utils = {
    // Fonction pour les requêtes AJAX
    async apiRequest(endpoint, method = "GET", data = null) {
        const options = {
            method,
            headers: { "Content-Type": "application/json" },
            credentials: 'include'
        };

        if (data && method !== "GET") {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(API_URL + endpoint, options);
            const responseData = await response.json();

            if (!responseData.success && responseData.message) {
                throw new Error(responseData.message);
            }

            return responseData;
        } catch (error) {
            console.error("Erreur API:", error);
            throw error;
        }
    },

    // Récupérer la valeur d'un champ de formulaire
    getFieldValue(selector) {
        const field = document.querySelector(selector);
        return field ? field.value.trim() : '';
    },

    // Redirection sécurisée
    redirect(path) {
        window.location.href = path;
    },

    // Formater la durée
    formatDuree(duree) {
        return duree === "1" ? "1 heure" : `${duree} minutes`;
    },

    // Afficher une erreur
    showError(error, defaultMessage) {
        console.error("Erreur:", error);
        alert(error.message || defaultMessage);
    }
};

// Gestion de l'authentification
const auth = {
    async login() {
        try {
            const email = utils.getFieldValue("[name='email']");
            const password = utils.getFieldValue("[name='password']");

            if (!email || !password) {
                throw new Error("Veuillez remplir tous les champs");
            }

            const data = await utils.apiRequest("login.php", "POST", { email, password });
            const redirectPage = data.type === "etudiant" ? "dashboard_etudiant.html" : "dashboard_prof.html";
            utils.redirect(redirectPage);
        } catch (error) {
            utils.showError(error, "Erreur lors de la connexion");
        }
    },

    async register() {
        try {
            const userData = {
                nom: utils.getFieldValue("[name='nom']"),
                email: utils.getFieldValue("[name='email']"),
                password: utils.getFieldValue("[name='password']"),
                type: utils.getFieldValue("[name='type']"),
            };

            const requiredFields = ['nom', 'email', 'password', 'type'];
            if (requiredFields.some(field => !userData[field])) {
                throw new Error("Veuillez remplir tous les champs obligatoires");
            }

            const response = await utils.apiRequest("register.php", "POST", userData);
            if (response.success) {
                alert("Inscription réussie ! Vous allez être redirigé vers la page de connexion.");
                window.location.href = "login.html";
            }
        } catch (error) {
            utils.showError(error, "Erreur lors de l'inscription");
        }
    },

    async logout() {
        try {
            await utils.apiRequest("logout.php");
            utils.redirect('login.html');
        } catch (error) {
            utils.showError(error, "Erreur lors de la déconnexion");
            utils.redirect("login.html");
        }
    }
};
// Gestion des évaluations côté étudiant
const evaluationManager = {
    timerInterval: null,
    tempsRestant: 0,

    async chargerEvaluation(evaluationId) {
        try {
            const data = await utils.apiRequest(`get_evaluation.php?id=${evaluationId}`);
            const evaluation = data.evaluation;

            this.mettreAJourInterface(evaluation);
            this.demarrerTimer(evaluation.duree);
            this.chargerQuestions(evaluation.questions);
        } catch (error) {
            utils.showError(error, "Erreur lors du chargement de l'évaluation");
            utils.redirect('dashboard_etudiant.html');
        }
    },

    mettreAJourInterface(evaluation) {
        document.getElementById('evaluation-title').textContent = evaluation.titre;
        document.getElementById('evaluation-date').textContent = evaluation.date;
        document.getElementById('evaluation-duration').textContent = utils.formatDuree(evaluation.duree);
    },

    demarrerTimer(dureeMinutes) {
        this.tempsRestant = dureeMinutes * 60;
        this.timerInterval = setInterval(() => {
            this.tempsRestant--;
            if (this.tempsRestant <= 0) {
                clearInterval(this.timerInterval);
                this.soumettreEvaluation();
            }
            this.mettreAJourAffichageTimer();
        }, 1000);
    },

    mettreAJourAffichageTimer() {
        const heures = Math.floor(this.tempsRestant / 3600);
        const minutes = Math.floor((this.tempsRestant % 3600) / 60);
        const secondes = this.tempsRestant % 60;

        const affichage = `${String(heures).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secondes).padStart(2, '0')}`;
        const timerElement = document.getElementById('timer-display');
        if (timerElement) {
            timerElement.textContent = affichage;
            if (this.tempsRestant < 300) {
                document.querySelector('.timer')?.classList.add('timer-warning');
            }
        }
    },

    chargerQuestions(questions) {
        const container = document.getElementById('questions-container');
        const questionTemplate = document.getElementById('question-template');
        const reponseTemplate = document.getElementById('reponse-template');

        if (!container || !questionTemplate || !reponseTemplate) {
            throw new Error('Templates de questions non trouvés');
        }

        container.innerHTML = '';
        questions.forEach((question, index) => {
            const questionElement = questionTemplate.content.cloneNode(true);
            const questionBlock = questionElement.querySelector('.question-block');
            
            if (!questionBlock) return;

            questionBlock.setAttribute('data-question-id', question.id);
            questionElement.querySelector('.question-title').textContent = `${index + 1}. ${question.texte}`;

            const reponsesContainer = questionElement.querySelector('.reponses-container');
            if (reponsesContainer) {
                this.ajouterReponses(question.reponses, reponsesContainer, reponseTemplate, index);
            }

            container.appendChild(questionElement);
        });
    },

    ajouterReponses(reponses, container, template, questionIndex) {
        reponses.forEach((reponse, reponseIndex) => {
            const reponseElement = template.content.cloneNode(true);
            const checkbox = reponseElement.querySelector('.reponse-checkbox');
            const label = reponseElement.querySelector('.reponse-label');

            if (!checkbox || !label) return;

            checkbox.id = `q${questionIndex}_r${reponseIndex}`;
            checkbox.name = `question_${questionIndex}`;
            checkbox.value = reponse.id; // Utiliser l'ID de la réponse au lieu de l'index

            label.htmlFor = checkbox.id;
            label.textContent = reponse.texte;

            container.appendChild(reponseElement);
        });
    },



    async soumettreEvaluation() {
        try {
            const reponses = [];
            document.querySelectorAll('.question-block').forEach(questionBlock => {
                const questionId = questionBlock.getAttribute('data-question-id');
                const reponsesCochees = Array.from(questionBlock.querySelectorAll('.reponse-checkbox:checked'));
                
                if (reponsesCochees.length > 0) {
                    reponses.push({
                        question_id: parseInt(questionId),
                        reponses: reponsesCochees.map(checkbox => parseInt(checkbox.value))
                    });
                }
            });

            console.log('Réponses collectées:', reponses);

            if (!reponses.length) {
                throw new Error('Aucune réponse n\'a été sélectionnée');
            }

            const data = await utils.apiRequest('soumettre_evaluation.php', 'POST', {
                evaluation_id: getEvaluationIdFromUrl(),
                reponses: reponses,
                temps_restant: this.tempsRestant
            });

            console.log('Réponse du serveur:', data);

            alert(`Évaluation soumise avec succès! Note: ${data.note}/20`);
            utils.redirect('dashboard_etudiant.html');
        } catch (error) {
            console.error('Erreur:', error);
            utils.showError(error, "Erreur lors de la soumission de l'évaluation");
        }
    },

    getEvaluationIdFromUrl() {
        const id = new URLSearchParams(window.location.search).get('id');
        if (!id) throw new Error('Aucun ID d\'évaluation spécifié');
        return id;
    },

    init() {
        if (!window.location.pathname.includes('passer_evaluation.html')) return;

        document.addEventListener('DOMContentLoaded', () => {
            try {
                const evaluationId = this.getEvaluationIdFromUrl();
                this.chargerEvaluation(evaluationId);

                document.getElementById('evaluation-form')?.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (confirm('Êtes-vous sûr de vouloir soumettre l\'évaluation ?')) {
                        this.soumettreEvaluation();
                    }
                });
            } catch (error) {
                utils.showError(error, "Erreur lors de l'initialisation");
                utils.redirect('dashboard_etudiant.html');
            }
        });
    }
};




// Appel automatique au chargement de la page
document.addEventListener("DOMContentLoaded", function() {
    console.log("✅ Script chargé !");
    document.getElementById("questionsContainer").innerHTML = "<p>Test affichage</p>";
});


// 🔹 Gestion des évaluations


let questionCount = 0;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnAjouterQuestion").addEventListener("click", ajouterQuestion);
    document.getElementById("btnCreerEvaluation").addEventListener("click", creerEvaluation);
    ajouterQuestion(); // Au moins une question par défaut
});

function ajouterQuestion() {
    questionCount++;
    const container = document.getElementById("questionsContainer");

    const div = document.createElement("div");
    div.classList.add("question");
    div.id = `question_${questionCount}`;
    div.innerHTML = `
        <div class="question-header">
            <h4><i class='bx bx-help-circle'></i> Question ${questionCount}</h4>
            <button type="button" onclick="supprimerQuestion(${questionCount})" class="delete-question">
                <i class='bx bx-trash'></i> 
            </button>
        </div>
        <textarea class="question_text" placeholder="Écrivez votre question ici" required></textarea>
        <div class="reponsesContainer"></div>
        <div class="question-footer">
            <button type="button" onclick="ajouterReponse(${questionCount})" class="btn btn-secondary">
                <i class='bx bx-plus'></i> Ajouter une réponse
            </button>
        </div>
    `;
    container.appendChild(div);
}

function ajouterReponse(questionId) {
    const reponsesContainer = document.querySelector(`#question_${questionId} .reponsesContainer`);
    const div = document.createElement("div");
    div.classList.add("reponse");

    div.innerHTML = `
        <input type="text" class="reponse_text" placeholder="Réponse" required>
        <label><input type="checkbox" class="est_correct"></label>
        <button type="button" onclick="this.parentNode.remove()" class="delete-reponse">
            <i class='bx bx-x'></i>
        </button>
    `;

    reponsesContainer.appendChild(div);
}

async function creerEvaluation() {
    const titre = document.getElementById("titre").value.trim();
    const date = document.getElementById("date_evaluation").value;
    const heure = document.getElementById("heure_evaluation").value;
    const duree = document.getElementById("duree_evaluation").value;
    const niveau = document.getElementById("niveau").value;
    const semestre = document.getElementById("semestre").value;
    const module = document.getElementById("module").value;

    if (!titre || !date || !heure || !duree || !niveau || !semestre || !module) {
        alert("Veuillez remplir tous les champs !");
        return;
    }

    const questions = [];
    const questionElements = document.querySelectorAll(".question");

    for (let qEl of questionElements) {
        const questionText = qEl.querySelector(".question_text").value.trim();
        const reponses = [];
        let hasCorrect = false;

        const reponseElements = qEl.querySelectorAll(".reponse");
        for (let rEl of reponseElements) {
            const texte = rEl.querySelector(".reponse_text").value.trim();
            const correct = rEl.querySelector(".est_correct").checked;
            if (texte) {
                reponses.push({ texte, correct: correct ? 1 : 0 });
                if (correct) hasCorrect = true;
            }
        }

        if (!questionText || reponses.length < 2 || !hasCorrect) {
            alert("Chaque question doit avoir au moins 2 réponses et 1 correcte !");
            return;
        }

        questions.push({ question: questionText, reponses });
    }

    if (questions.length === 0) {
        alert("Ajoutez au moins une question !");
        return;
    }

    const payload = {
        titre, 
        date_evaluation: date,
        heure_evaluation: heure,
        duree_evaluation: duree,
        niveau,
        semestre,
        module,
        questions
    };

    const res = await fetch(API_URL + "creer_evaluation.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
        alert("✅ Évaluation créée !");
        window.location.href = "dashboard_prof.html";
    } else {
        alert("❌ Erreur : " + result.message);
    }
}

function supprimerQuestion(id) {
    const element = document.getElementById(`question_${id}`);
    if (element) element.remove();
}


function supprimerReponse(element) {
    let reponseDiv = element.closest(".reponse");
    if (reponseDiv) {
        reponseDiv.remove();
        console.log("❌ Réponse supprimée !");
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const evaluationsContainer = document.getElementById('mesEvaluations');
    if (!evaluationsContainer) {
        console.error('Élément "mesEvaluations" introuvable !');
        return;  // Arrêter l'exécution si l'élément est introuvable
    }

    afficherEvaluations();

    evaluationsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-evaluation')) {
            const evalId = event.target.getAttribute('data-id');
            supprimerEvaluation(evalId);
        }
    });
});


async function afficherEvaluations() {
    try {
        const response = await fetch('../api/get_evaluations.php');
        const data = await response.json();
        console.log(data);

        if (data.success) {
            const evaluationsContainer = document.getElementById('mesEvaluations');
            evaluationsContainer.innerHTML = ''; // Vider les évaluations précédentes

            data.evaluations.forEach(eval => {
                // Formatage de la durée
                let dureeFormatee = "";
                if (eval.duree_evaluation === "1") {
                    dureeFormatee = "1 h";
                } else {
                    dureeFormatee = eval.duree_evaluation + " min";
                }

                const evalDiv = document.createElement('div');
                evalDiv.classList.add('evaluation');
                evalDiv.innerHTML = `
                    <div>
                        <h3>${eval.titre}</h3>
                        <p>${eval.module}</p>
                        <p><strong>Niveau:</strong> ${eval.niveau}</p>
                        <p><strong>Date de l'évaluation:</strong> ${eval.date_evaluation}</p>
                        <p><strong>Heure de l'évaluation:</strong> ${eval.heure_evaluation.substring(0, 5)}</p>
                        <p><strong>Durée de l'évaluation:</strong> ${dureeFormatee}</p>
                        <div class="evaluation-actions">
                            <button class="btn btn-danger delete-evaluation" data-id="${eval.id}">
                                <i class='bx bx-trash'></i> Supprimer
                            </button>
                        </div>
                    </div>
                `;
                evaluationsContainer.appendChild(evalDiv);
            });
        } else {
            alert("Erreur : " + data.message);
        }
    } catch (error) {
        alert("Erreur de chargement des évaluations.");
        console.error(error);
    }
}


async function supprimerEvaluation(evalId) {
    const confirmation = confirm("Êtes-vous sûr de vouloir supprimer cette évaluation ?");
    if (!confirmation) return;

    try {
        const response = await fetch('../api/supprimer_evaluation.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: evalId }) // Assurez-vous d'envoyer l'ID de l'évaluation sous forme d'objet JSON
        });
        const data = await response.json();

        if (data.success) {
            alert("Évaluation supprimée !");
            afficherEvaluations(); // Rafraîchir la liste des évaluations
        } else {
            alert("Erreur lors de la suppression.");
        }
    } catch (error) {
        alert("Erreur lors de la suppression.");
    }
}

function mettreAJourAffichageTimer() {
    const heures = Math.floor(tempsRestant / 3600);
    const minutes = Math.floor((tempsRestant % 3600) / 60);
    const secondes = tempsRestant % 60;

    const affichage = `${String(heures).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secondes).padStart(2, '0')}`;
    document.getElementById('timer-display').textContent = affichage;

    // Ajouter une classe d'alerte si moins de 5 minutes restantes
    if (tempsRestant < 300) {
        document.querySelector('.timer').classList.add('timer-warning');
    }
}

// Fonction pour charger les questions
function chargerQuestions(questions) {
    const container = document.getElementById('questions-container');
    const questionTemplate = document.getElementById('question-template');
    const reponseTemplate = document.getElementById('reponse-template');

    questions.forEach((question, index) => {
        const questionElement = questionTemplate.content.cloneNode(true);
        const questionBlock = questionElement.querySelector('.question-block');
        questionBlock.setAttribute('data-question-id', question.id);
        questionElement.querySelector('.question-title').textContent = `${index + 1}. ${question.texte}`;

        const reponsesContainer = questionElement.querySelector('.reponses-container');
        question.reponses.forEach((reponse, reponseIndex) => {
            const reponseElement = reponseTemplate.content.cloneNode(true);
            const checkbox = reponseElement.querySelector('.reponse-checkbox');
            const label = reponseElement.querySelector('.reponse-label');

            checkbox.id = `q${question.id}_r${reponse.id}`;
            checkbox.name = `question_${question.id}`;
            checkbox.value = reponse.id;

            label.htmlFor = checkbox.id;
            label.textContent = reponse.texte;

            reponsesContainer.appendChild(reponseElement);
        });

        container.appendChild(questionElement);
    });
}

// Fonction utilitaire pour récupérer l'ID de l'évaluation depuis l'URL
function getEvaluationIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Initialisation de la page d'évaluation
if (window.location.pathname.includes('passer_evaluation.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const evaluationId = getEvaluationIdFromUrl();
        if (evaluationId) {
            evaluationManager.chargerEvaluation(evaluationId);
        } else {
            alert('Aucune évaluation spécifiée');
            window.location.href = 'dashboard_etudiant.html';
        }

        // Gestionnaire de soumission du formulaire
        document.getElementById('evaluation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            if (confirm("\u00cates-vous s\u00fbr de vouloir soumettre l'évaluation ?")) {
                evaluationManager.soumettreEvaluation();
            }
        });
    });
}

// Variable globale pour stocker les notes
let notesData = [];

// Fonction principale pour afficher les notes
async function afficherNotesEtudiants() {
    try {
        const data = await utils.apiRequest('get_notes_etudiants.php');
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors du chargement des notes');
        }

        notesData = data.notes || [];
    

        // Filtrer les notes selon le niveau sélectionné
        const filtreNiveau = document.getElementById('filtre-niveau').value;
        const notesFiltrees = notesData.filter(note => 
            !filtreNiveau || note.niveau === filtreNiveau
        );

        // Afficher les notes
        afficherTableauNotes(notesFiltrees);

    } catch (error) {
        console.error('Erreur:', error);
        utils.showError(error, "Erreur lors du chargement des notes");
    }
}

// Fonction pour afficher le tableau des notes
function afficherTableauNotes(notes) {
    const tbody = document.getElementById('notes-etudiants');
    if (!tbody) return;

    if (notes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    <i class='bx bx-info-circle'></i>
                    Aucune note disponible
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    notes.forEach(note => {
        const tr = document.createElement('tr');
        const dateEval = new Date(note.date_evaluation);
        const dateSoumission = new Date(note.date_soumission);

        tr.innerHTML = `
            <td>
                <div class="evaluation-title">
                    <i class='bx bx-book-content'></i>
                    ${note.evaluation_titre}
                </div>
            </td>
            <td>${dateEval.toLocaleDateString()}</td>
            <td>
                <span class="niveau-badge ${note.niveau.toLowerCase()}">
                    ${note.niveau} - ${note.semestre}
                </span>
                <div class="module-name">${note.module}</div>
            </td>
            <td>
                <div class="student-name">
                    <i class='bx bx-user'></i>
                    ${note.etudiant_nom}
                </div>
            </td>
            <td>
                <div class="note-value ${getNoteCssClass(note.note)}">
                    ${note.note}/20
                </div>
            </td>
            <td>${dateSoumission.toLocaleString()}</td>
        `;

        tbody.appendChild(tr);
    });
}

// Fonction pour filtrer les notes (recherche)
function filtrerNotes() {
    const searchTerm = document.getElementById('search-notes').value.toLowerCase();
    const filtreNiveau = document.getElementById('filtre-niveau').value;

    const notesFiltrees = notesData.filter(note => {
        const matchNiveau = !filtreNiveau || note.niveau === filtreNiveau;
        const matchSearch = 
            note.etudiant_nom.toLowerCase().includes(searchTerm) ||
            note.evaluation_titre.toLowerCase().includes(searchTerm) ||
            note.module.toLowerCase().includes(searchTerm);
        return matchNiveau && matchSearch;
    });

    afficherTableauNotes(notesFiltrees);
}

// Fonction utilitaire pour déterminer la classe CSS de la note
function getNoteCssClass(note) {
    note = parseFloat(note);
    if (note >= 16) return 'note-excellent';
    if (note >= 14) return 'note-tres-bien';
    if (note >= 12) return 'note-bien';
    if (note >= 10) return 'note-passable';
    return 'note-insuffisant';
}

// Fonction pour mettre à jour les modules en fonction du niveau et du semestre
function updateFiltres() {
    const niveau = document.getElementById('niveau-etudiant').value;
    const moduleSelect = document.getElementById('module-etudiant');

    // Réinitialiser la liste des modules
    moduleSelect.innerHTML = '<option value="">Tous les modules</option>';

    // Si nous avons un niveau sélectionné
    if (niveau && MODULES_PAR_NIVEAU[niveau]) {
        // Combiner les modules des deux semestres
        const allModules = [
            ...MODULES_PAR_NIVEAU[niveau]['Semestre 1'] || [],
            ...MODULES_PAR_NIVEAU[niveau]['Semestre 2'] || []
        ];
        
        // Trier et supprimer les doublons
        [...new Set(allModules)].sort().forEach(module => {
            const option = document.createElement('option');
            option.value = module;
            option.textContent = module;
            moduleSelect.appendChild(option);
        });
    }

    // Mettre à jour les évaluations
    voirEvaluationsEtudiant();
}

async function voirEvaluationsEtudiant() {
    try {
        const niveau = document.getElementById('niveau-etudiant').value;
        const module = document.getElementById('module-etudiant').value;
        
        // Construire l'URL avec les paramètres de filtrage
        let url = 'get_evaluations_etudiant.php?';
        const params = [];
        
        if (niveau) params.push(`niveau=${niveau}`);
        if (module) params.push(`module=${module}`);
        
        url += params.join('&');
        
        // Récupérer les évaluations à venir
        const dataAVenir = await utils.apiRequest(url);
        // Récupérer les évaluations passées sans filtres
        const dataPassees = await utils.apiRequest('get_evaluations_passees.php');

        // Conteneurs pour les évaluations
        const evaluationsPassees = document.getElementById('evaluations-passees');
        const evaluationsAVenir = document.getElementById('evaluations-a-venir');
        
        // Vider les conteneurs
        evaluationsPassees.innerHTML = '';
        evaluationsAVenir.innerHTML = '';

        // Afficher les évaluations à venir
        if (dataAVenir.success) {
            dataAVenir.evaluations.forEach(eval => {
                const evalElement = document.createElement('div');
                evalElement.className = 'evaluation-card';
                
                // Formatage de la durée
                let dureeFormatee = utils.formatDuree(eval.duree_evaluation);

                evalElement.innerHTML = `
                    <h3>${eval.titre}</h3>
                    <div class="eval-details">
                        <p><strong>Date:</strong> ${eval.date_evaluation}</p>
                        <p><strong>Heure:</strong> ${eval.heure_evaluation}</p>
                        <p><strong>Durée:</strong> ${dureeFormatee}</p>
                        <p><strong>Niveau:</strong> ${eval.niveau}</p>
                        <p><strong>Semestre:</strong> ${eval.semestre}</p>
                        <p><strong>Module:</strong> ${eval.module}</p>
                    </div>
                    <div class="eval-actions">
                        <button onclick="window.location.href='passer_evaluation.html?id=${eval.id}'" class="btn btn-primary">Passer l'évaluation</button>
                    </div>
                `;

                evaluationsAVenir.appendChild(evalElement);
            });

            // Afficher un message si aucune évaluation n'est trouvée
            if (evaluationsAVenir.children.length === 0) {
                evaluationsAVenir.innerHTML = '<div class="no-eval">Aucune évaluation à venir</div>';
            }
        }

        // Afficher les évaluations passées
        if (dataPassees.success) {
            dataPassees.evaluations.forEach(eval => {
                const evalElement = document.createElement('div');
                evalElement.className = 'evaluation-card passed';
                
                // Formatage de la durée
                let dureeFormatee = utils.formatDuree(eval.duree_evaluation);

                evalElement.innerHTML = `
                    <h3>${eval.titre}</h3>
                    <div class="eval-details">
                        <p><strong>Date:</strong> ${eval.date_evaluation}</p>
                        <p><strong>Heure:</strong> ${eval.heure_evaluation}</p>
                        <p><strong>Durée:</strong> ${dureeFormatee}</p>
                        <p><strong>Niveau:</strong> ${eval.niveau}</p>
                        <p><strong>Semestre:</strong> ${eval.semestre}</p>
                        <p><strong>Module:</strong> ${eval.module}</p>
                        <p class="note"><strong>Note obtenue:</strong> ${eval.note}/20</p>
                    </div>
                `;

                evaluationsPassees.appendChild(evalElement);
            });

            // Afficher un message si aucune évaluation passée n'est trouvée
            if (evaluationsPassees.children.length === 0) {
                evaluationsPassees.innerHTML = '<div class="no-eval">Aucune évaluation passée</div>';
            }
        }
    } catch (error) {
        utils.showError(error, "Erreur lors du chargement des évaluations");
    }
}






