// Configuration de base
const API_URL = "http://localhost/gestion_evaluations/api/";

// Utilitaires

// Fonction pour mettre à jour les filtres de notes
async function updateFiltresNotes() {
    // Charger les notes avec les filtres actuels
    chargerNotes();
}

// Fonction pour charger et afficher les notes
async function chargerNotes() {
    const notesContainer = document.getElementById('notes-container');
    if (!notesContainer) return;

    // Récupérer les valeurs des filtres
    const niveau = document.getElementById('niveau-notes').value;
    const semestre = document.getElementById('semestre-notes').value;
    const module = document.getElementById('module-notes').value;

    // Si aucun filtre n'est sélectionné, afficher le message initial
    if (!niveau && !semestre && !module) {
        notesContainer.innerHTML = `
            <div class="select-filters-message">
                <i class='bx bx-filter-alt'></i>
                <p>Veuillez sélectionner au moins un critère de consultation</p>
            </div>
        `;
        return;
    }

    try {
        // Construire l'URL avec les paramètres de filtrage
        let url = `${API_URL}get_notes_etudiants.php`;
        const params = [];
        if (niveau) params.push(`niveau=${niveau}`);
        if (semestre) {
            // Convertir S1/S2 en format de la base de données
            const semestreValue = semestre === 'S1' ? 'Semestre 1' : 'Semestre 2';
            params.push(`semestre=${semestreValue}`);
        }
        if (module) params.push(`module=${encodeURIComponent(module)}`);
        
        url += '?' + params.join('&');

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.evaluations) {
            notesContainer.innerHTML = '';
            
            if (data.evaluations.length > 0) {
                // Pour chaque évaluation
                data.evaluations.forEach(evalData => {
                    // Titre de l'évaluation
                    const evalTitle = document.createElement('h3');
                    evalTitle.className = 'evaluation-title';
                    evalTitle.textContent = evalData.evaluation.evaluation_titre;
                    notesContainer.appendChild(evalTitle);
                    
                    const table = document.createElement('table');
                    table.className = 'notes-table';

                    // En-tête du tableau
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th>Étudiant</th>
                                <th>Parcours</th>
                                <th>Semestre</th>
                                <th>Module</th>
                                <th>Note</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    `;
                    
                    if (evalData.notes && evalData.notes.length > 0) {
                        // Ajouter les lignes de notes
                        evalData.notes.forEach(note => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>
                                    <div class="student-name">
                                        <i class='bx bx-user'></i>
                                        ${note.etudiant_nom}
                                    </div>
                                </td>
                                <td>${evalData.evaluation.niveau}</td>
                                <td>${evalData.evaluation.semestre}</td>
                                <td>${evalData.evaluation.module}</td>
                                <td>
                                    <div class="note-value ${getNoteCssClass(note.note)}">
                                        ${note.note}/20
                                    </div>
                                </td>
                            `;
                            table.querySelector('tbody').appendChild(tr);
                        });
                    } else {
                        // Aucune note pour cette évaluation
                        table.querySelector('tbody').innerHTML = `
                            <tr>
                                <td colspan="5" style="text-align: center; padding: 20px;">
                                    Aucune note pour cette évaluation
                                </td>
                            </tr>
                        `;
                    }

                    notesContainer.appendChild(table);
                });
            } else {
                notesContainer.innerHTML = `
                    <div class="no-data" style="text-align: center; padding: 20px;">
                        Aucune évaluation trouvée pour les critères sélectionnés
                    </div>
                `;
            }
        } else {
            notesContainer.innerHTML = '<p>Erreur lors du chargement des notes.</p>';
        }
    } catch (error) {
        console.error('Erreur:', error);
        notesContainer.innerHTML = '<p>Erreur lors du chargement des notes.</p>';
    }
}

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
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const responseData = await response.json();
            return responseData; // Retourner toute la réponse, même en cas d'erreur

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
        const baseUrl = '/gestion_evaluations/pages/';
        window.location.href = baseUrl + path;
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
    // Affichage dynamique du champ niveau
    initRegisterForm() {
        const typeSelect = document.getElementById('type');
        const niveauGroup = document.getElementById('niveau-group');
        if (!typeSelect || !niveauGroup) return;
        typeSelect.addEventListener('change', function() {
            if (this.value === 'etudiant') {
                niveauGroup.style.display = '';
            } else {
                niveauGroup.style.display = 'none';
                document.getElementById('niveau').value = '';
            }
        });
    },
    async login() {
        try {
            const email = utils.getFieldValue("[name='email']");
            const password = utils.getFieldValue("[name='password']");

            if (!email || !password) {
                throw new Error("Veuillez remplir tous les champs");
            }

            const data = await utils.apiRequest("login.php", "POST", { email, password });
            
            let redirectPage;
            if (data.type === "admin") {
                redirectPage = "dashboard_admin.html";
            } else {
                redirectPage = data.type === "etudiant" ? "dashboard_etudiant.html" : "dashboard_prof.html";
            }
            
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
            // Si étudiant, ajouter le niveau
            if (userData.type === 'etudiant') {
                userData.niveau = utils.getFieldValue("[name='niveau']");
                if (!userData.niveau) {
                    throw new Error("Veuillez sélectionner le niveau");
                }
            }
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
            this.demarrerTimer(evaluation.duree_evaluation);
            this.chargerQuestions(evaluation.questions);
        } catch (error) {
            utils.showError(error, "Erreur lors du chargement de l'évaluation");
            utils.redirect('dashboard_etudiant.html');
        }
    },

    mettreAJourInterface(evaluation) {
        document.getElementById('evaluation-title').textContent = evaluation.titre;
        document.getElementById('evaluation-date').textContent = evaluation.date_evaluation;
        document.getElementById('evaluation-duration').textContent = utils.formatDuree(evaluation.duree_evaluation);
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

            console.log('Soumission réussie, désactivation des protections de navigation');
            // Marquer l'évaluation comme soumise
            sessionStorage.setItem('evaluationSoumise', 'true');
            
            // Désactiver le blocage de navigation
            window.onbeforeunload = null;
            alert(`Évaluation soumise avec succès! Note: ${data.note}/20`);
            window.location.href = 'dashboard_etudiant.html';
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
document.addEventListener("DOMContentLoaded", async function() {
    // Gestion du bouton "Modifier niveau"
    const btnModifierNiveau = document.getElementById('btn-modifier-niveau');
    const modalNiveau = document.getElementById('modal-niveau');
    const selectNiveau = document.getElementById('niveau-etudiant');
    const selectNouveauNiveau = document.getElementById('nouveau-niveau');
    const btnValiderNiveau = document.getElementById('valider-niveau');
    const btnAnnulerNiveau = document.getElementById('annuler-niveau');

    if (btnModifierNiveau && modalNiveau && selectNiveau && selectNouveauNiveau && btnValiderNiveau && btnAnnulerNiveau) {
        btnModifierNiveau.addEventListener('click', () => {
            // Préselectionner le niveau actuel
            selectNouveauNiveau.value = selectNiveau.value || 'L1';
            modalNiveau.style.display = 'flex';
        });
        btnAnnulerNiveau.addEventListener('click', () => {
            modalNiveau.style.display = 'none';
        });
        btnValiderNiveau.addEventListener('click', async () => {
            const nouveauNiveau = selectNouveauNiveau.value;
            if (!['L1','L2','L3'].includes(nouveauNiveau)) return;
            try {
                const res = await utils.apiRequest('update_niveau.php', 'POST', { niveau: nouveauNiveau });
                if (res.success && res.niveau) {
                    selectNiveau.value = res.niveau;
                    selectNiveau.dispatchEvent(new Event('change'));
                    alert('Niveau mis à jour avec succès !');
                } else {
                    alert(res.message || 'Erreur lors de la mise à jour du niveau');
                }
            } catch (e) {
                alert('Erreur serveur lors de la mise à jour du niveau');
            }
            modalNiveau.style.display = 'none';
        });
        // Fermer la modal si on clique en dehors du contenu
        modalNiveau.addEventListener('click', (e) => {
            if (e.target === modalNiveau) modalNiveau.style.display = 'none';
        });
    }

    // Préremplir le niveau de l'étudiant si présent
    if (window.location.pathname.includes("dashboard_etudiant.html")) {
        const niveauSelect = document.getElementById('niveau-etudiant');
        if (niveauSelect) {
            try {
                // Appel API pour récupérer le niveau
                const res = await utils.apiRequest('get_user_info.php', 'GET');
                if (res.success && res.niveau) {
                    niveauSelect.value = res.niveau;
                    // Déclencher le changement pour mettre à jour les modules
                    niveauSelect.dispatchEvent(new Event('change'));
                }
            } catch (e) {
                // Optionnel : afficher une erreur ou ignorer
            }
        }
    }
    console.log("✅ Script chargé !");
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '<p>Chargement de la conversation...</p>';
    }
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

    // Vérifier que la date n'est pas dans le passé
    const maintenant = new Date();
    const [annee, mois, jour] = date.split('-');
    const [heures, minutes] = heure.split(':');
    const dateEvaluation = new Date(annee, mois - 1, jour, heures, minutes);

    if (dateEvaluation < maintenant) {
        alert("La date de l'évaluation ne peut pas être dans le passé !");
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

document.addEventListener("DOMContentLoaded", () => {
    const evaluationsContainer = document.getElementById('mesEvaluations');
    if (!evaluationsContainer) {
        console.log('Élément "mesEvaluations" introuvable !');
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
}


async function afficherEvaluations() {
    try {
        console.log('Début du chargement des évaluations...');
        const response = await fetch('../api/get_evaluations.php');
        const data = await response.json();
        console.log('Réponse du serveur:', data);

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

// Fonction pour empêcher la navigation sur la page d'évaluation
function bloquerNavigation() {
    console.log('Blocage de la navigation activé');

    // Empêcher TOUTE navigation
    window.addEventListener('beforeunload', function(e) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    });

    // Empêcher le retour arrière
    window.addEventListener('popstate', function(e) {
        e.preventDefault();
        e.stopPropagation();
        history.pushState(null, null, window.location.href);
        alert('Vous devez soumettre votre évaluation avant de quitter.');
    });

    // Empêcher la navigation par URL
    window.addEventListener('hashchange', function(e) {
        e.preventDefault();
        alert('Vous devez soumettre votre évaluation avant de quitter.');
    });

    // Empêcher les raccourcis clavier
    document.addEventListener('keydown', function(e) {
        if ((e.altKey && ['ArrowLeft', 'ArrowRight'].includes(e.key)) ||
            (e.ctrlKey && e.key.toLowerCase() === 'w') ||
            (e.key === 'Backspace' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName))) {
            e.preventDefault();
            alert('Vous devez soumettre votre évaluation avant de quitter.');
        }
    });

    // Forcer l'état de l'historique
    history.pushState(null, null, window.location.href);
    history.pushState(null, null, window.location.href);
    history.pushState(null, null, window.location.href);
}

// Initialisation de la page d'évaluation
if (window.location.pathname.includes('passer_evaluation.html')) {
    // Bloquer IMMÉDIATEMENT toute navigation
    window.addEventListener('beforeunload', function(e) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    });

    // Empêcher le retour arrière immédiatement
    history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', function(e) {
        e.preventDefault();
        history.pushState(null, null, window.location.href);
        alert('Vous devez soumettre votre évaluation avant de quitter.');
    });

    document.addEventListener('DOMContentLoaded', () => {
        // Activer tous les autres blocages une fois la page chargée
        bloquerNavigation();
        const evaluationId = getEvaluationIdFromUrl();
        if (evaluationId) {
            evaluationManager.chargerEvaluation(evaluationId);
        } else {
            // Marquer l'évaluation comme soumise et rediriger
            window.evaluationSoumise = true;
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

// Fonction pour voir les évaluations de l'enseignant
async function voirEvaluationsEnseignant() {
    try {
        const niveauElement = document.getElementById('niveau');
        const moduleElement = document.getElementById('module');
        const container = document.getElementById('mesEvaluations');

        if (!container) {
            console.error('Container des évaluations non trouvé');
            return;
        }

        const niveau = niveauElement ? niveauElement.value : '';
        const module = moduleElement ? moduleElement.value : '';

        const response = await fetch('../api/get_evaluations_enseignant.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                niveau: niveau,
                module: module
            })
        });

        const data = await response.json();

        if (data.success && data.evaluations.length > 0) {
            let html = '<div class="evaluations-grid">';
            data.evaluations.forEach(eval => {
                html += `
                    <div class="evaluation-card">
                        <h3>${eval.titre}</h3>
                        <div class="eval-details">
                            <p><strong>Module:</strong> ${eval.module}</p>
                            <p><strong>Date:</strong> ${eval.date_evaluation}</p>
                            <p><strong>Durée:</strong> ${eval.duree_evaluation} minutes</p>
                        </div>
                        <div class="eval-actions">
                            <button onclick="window.location.href='modifier_evaluation.html?id=${eval.id}'" class="btn btn-secondary">
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button onclick="supprimerEvaluation(${eval.id})" class="btn btn-danger">
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                            <a href="consulter_notes.html?id=${eval.id}" class="btn btn-primary">
                                <i class="fas fa-chart-bar"></i> Consulter les Notes
                            </a>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div style="text-align: center; padding: 20px; margin-top: 20px; color: #666; font-size: 1.1em;">Aucune évaluation trouvée</div>';
        }
    } catch (error) {
        console.error('Erreur:', error);
                const errorContainer = document.createElement('div');
                errorContainer.className = 'evaluation-card';
                errorContainer.style.cssText = `
                    margin: 20px 150px;
                    text-align: center;
                    padding: 30px;
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                `;
                errorContainer.innerHTML = `
                    <div style="font-size: 1.2em; color: #555;">
                        Une erreur est survenue lors de la récupération de votre parcours
                    </div>`;
                document.getElementById('evaluations-container').innerHTML = '';
                document.getElementById('evaluations-container').appendChild(errorContainer);
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
    if (note >= 16) return 'text-success';
    if (note >= 14) return 'text-info';
    if (note >= 12) return 'text-primary';
    if (note >= 10) return 'text-warning';
    return 'text-danger';
}

// Fonction pour afficher les notes de l'étudiant
async function afficherMesNotes() {
    const modal = document.getElementById('modal-notes');
    modal.style.display = 'flex';
    await chargerNotes();
}

async function chargerNotes() {
    try {
        const container = document.getElementById('notes-container');
        const niveau = document.getElementById('niveau-notes').value;
        
        // Afficher un message de chargement
        container.innerHTML = '<div class="text-center">Chargement des notes...</div>';
        
        // Récupérer les notes
        const response = await utils.apiRequest(`get_notes_etudiant.php?niveau=${niveau}`);
        
        if (!response.success) {
            container.innerHTML = `<div class="alert alert-danger">${response.message || 'Erreur lors de la récupération des notes'}</div>`;
            return;
        }
        
        if (!response.notes || response.notes.length === 0) {
            container.innerHTML = `<div class="alert alert-info">Aucune note disponible pour le niveau ${niveau}</div>`;
            return;
        }
        
        // Créer le tableau des notes
        const table = document.createElement('table');
        table.className = 'table';
        table.style.width = '100%';
        table.style.borderCollapse = 'separate';
        table.style.borderSpacing = '0';
        table.style.marginTop = '15px';
        table.style.backgroundColor = 'white';
        table.style.borderRadius = '8px';
        table.style.overflow = 'hidden';
        table.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
        
        table.innerHTML = `
            <thead>
                <tr style="background-color: #f4f6f8;">
                    <th style="padding: 15px 20px; text-align: left; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e9ecef; font-size: 14px;">Module</th>
                    <th style="padding: 15px 20px; text-align: left; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e9ecef; font-size: 14px;">Évaluation</th>
                    <th style="padding: 15px 20px; text-align: center; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e9ecef; font-size: 14px; width: 120px;">Note</th>
                </tr>
            </thead>
            <tbody>
                ${response.notes.map(note => `
                    <tr style="transition: background-color 0.2s; hover:background-color: #f8f9fa;">
                        <td style="padding: 12px 20px; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${note.module}</td>
                        <td style="padding: 12px 20px; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${note.titre}</td>
                        <td style="padding: 12px 20px; border-bottom: 1px solid #f0f0f0; text-align: center; font-weight: 600; font-size: 14px;" class="${getNoteCssClass(note.note)}">${note.note}/20</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.innerHTML = '';
        container.appendChild(table);
        
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('notes-container').innerHTML = `
            <div class="alert alert-danger">Une erreur est survenue lors de la récupération des notes</div>
        `;
    }
}

function updateFiltres() {
    const niveau = document.getElementById('niveau-etudiant').value;
    const moduleSelect = document.getElementById('module-etudiant');
    
    // Vider la liste des modules
    moduleSelect.innerHTML = '<option value="">Tous les modules</option>';
    
    if (niveau && MODULES_PAR_NIVEAU[niveau]) {
        // Ajouter les modules des deux semestres
        ['Semestre 1', 'Semestre 2'].forEach(semestre => {
            if (MODULES_PAR_NIVEAU[niveau][semestre] && MODULES_PAR_NIVEAU[niveau][semestre].length > 0) {
                // Créer un groupe pour le semestre
                const optgroup = document.createElement('optgroup');
                optgroup.label = semestre;
                
                // Ajouter les modules du semestre
                MODULES_PAR_NIVEAU[niveau][semestre].forEach(module => {
                    const option = document.createElement('option');
                    option.value = module;
                    option.textContent = module;
                    optgroup.appendChild(option);
                });
                
                moduleSelect.appendChild(optgroup);
            }
        });
    }
}

function updateModulesList(niveau) {
    const moduleSelect = document.getElementById('module-etudiant');
    if (!moduleSelect) return;

    // Sauvegarder la sélection actuelle
    const selectedModule = moduleSelect.value;

    // Vider la liste des modules
    moduleSelect.innerHTML = '<option value="">Tous les modules</option>';

    if (niveau && MODULES_PAR_NIVEAU[niveau]) {
        // Pour chaque semestre
        Object.keys(MODULES_PAR_NIVEAU[niveau]).forEach(semestre => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = semestre;

            // Ajouter les modules du semestre
            MODULES_PAR_NIVEAU[niveau][semestre].forEach(module => {
                const option = document.createElement('option');
                option.value = module;
                option.textContent = module;
                if (module === selectedModule) {
                    option.selected = true;
                }
                optgroup.appendChild(option);
            });
            moduleSelect.appendChild(optgroup);
        });
    }

    // Si le module sélectionné n'existe pas dans le nouveau niveau, réinitialiser à "Tous les modules"
    if (!moduleSelect.querySelector(`option[value="${selectedModule}"]`)) {
        moduleSelect.value = '';
    }
}

// Fonction pour mettre à jour les filtres
async function updateFiltres() {
    // Récupérer les valeurs des filtres
    const niveau = document.getElementById('niveau-etudiant')?.value;
    const moduleSelect = document.getElementById('module-etudiant');
    const module = moduleSelect?.value;

    // Sauvegarder la sélection actuelle du module
    const selectedModule = module;

    // Mettre à jour la liste des modules si le niveau a changé
    updateModulesList(niveau);

    // Rétablir la sélection du module si elle existe toujours dans la nouvelle liste
    if (selectedModule && moduleSelect) {
        const moduleOption = Array.from(moduleSelect.options).find(opt => opt.value === selectedModule);
        if (moduleOption) {
            moduleSelect.value = selectedModule;
        }
    }

    // Mettre à jour l'affichage des évaluations avec les filtres
    try {
        // Construire les paramètres de filtrage
        const currentModule = moduleSelect?.value;
        const params = {};
        
        if (niveau) params.niveau = niveau;
        if (currentModule) params.module = currentModule;

        // Convertir les paramètres en chaîne de requête
        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        console.log('Paramètres de filtrage:', params); // Debug

        // Mettre à jour les évaluations avec les filtres
        await Promise.all([
            voirEvaluationsAVenir(queryString),
            voirEvaluationsRatees(queryString)
        ]);


    } catch (error) {
        console.error('Erreur lors de la mise à jour des filtres:', error);
    }
}

// Fonction pour voir les évaluations de l'étudiant

// Fonction pour voir les évaluations à venir de l'étudiant
async function voirEvaluationsAVenir(queryParams = '') {
    const evaluationsDiv = document.getElementById('evaluations-a-venir');
    const noEvaluationsDiv = document.getElementById('no-evaluations');
    
    if (!evaluationsDiv || !noEvaluationsDiv) return;

    try {
        const url = '../api/get_evaluations_etudiant.php' + (queryParams ? '?' + queryParams : '');
        console.log('Appel API avec URL:', url); // Debug
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erreur lors de la récupération des évaluations');

        const data = await response.json();
        console.log('Réponse API:', data); // Debug

        if (data.success) {
            const evaluations = data.evaluations;

            if (evaluations.length > 0) {
                const grid = document.createElement('div');
                grid.className = 'evaluations-grid';

                grid.innerHTML = evaluations.map(eval => {
                    const dateEvaluation = new Date(eval.date_evaluation + 'T' + eval.heure_evaluation);
                    return `
                    <div class="evaluation-item">
                        <div class="evaluation-titre">${eval.titre}</div>
                        <div class="evaluation-info">
                            <div class="evaluation-info-row">
                                <div class="evaluation-info-label">Module :</div>
                                <div class="evaluation-info-value">${eval.module}</div>
                            </div>
                            <div class="evaluation-info-row">
                                <div class="evaluation-info-label">Date :</div>
                                <div class="evaluation-info-value">${dateEvaluation.toLocaleDateString('fr-FR')}</div>
                            </div>
                            <div class="evaluation-info-row">
                                <div class="evaluation-info-label">Heure :</div>
                                <div class="evaluation-info-value">${dateEvaluation.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <div class="evaluation-info-row">
                                <div class="evaluation-info-label">Parcours :</div>
                                <div class="evaluation-info-value">${eval.niveau}</div>
                            </div>
                            <div class="evaluation-info-row">
                                <div class="evaluation-info-label">Durée :</div>
                                <div class="evaluation-info-value">${eval.duree_evaluation} minutes</div>
                            </div>
                        </div>
                        <div class="evaluation-actions">
                            <a href="passer_evaluation.html?id=${eval.id}" class="btn btn-primary">
                                <i class='bx bx-play'></i> Passer l'évaluation
                            </a>
                        </div>
                    </div>`;
                }).join('');

                evaluationsDiv.innerHTML = '';
                evaluationsDiv.appendChild(grid);
                noEvaluationsDiv.style.display = 'none';
            } else {
                evaluationsDiv.innerHTML = '';
                noEvaluationsDiv.style.display = 'block';
                noEvaluationsDiv.innerHTML = `
                    <div class="no-evaluations">
                        Aucune évaluation à venir
                    </div>
                `;
            }
        } else {
            throw new Error(data.message || 'Erreur lors de la récupération des évaluations');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des évaluations à venir:', error);
        evaluationsDiv.innerHTML = `
            <div class="error-message">
                Une erreur est survenue lors de la récupération des évaluations
            </div>
        `;
    }
}

// Fonction pour voir les évaluations ratées de l'étudiant
async function voirEvaluationsRatees(queryParams = '') {
    const evaluationsRateesDiv = document.getElementById('evaluations-ratees');
    if (!evaluationsRateesDiv) return;

    try {
        const url = '../api/get_evaluations_ratees.php' + (queryParams ? '?' + queryParams : '');
        console.log('Appel API évaluations ratées avec URL:', url); // Debug
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erreur lors de la récupération des évaluations ratées');
        const data = await response.json();
        console.log('Réponse API évaluations ratées:', data); // Debug

        if (data.success) {
            const evaluations = data.evaluations || [];

            if (evaluations.length > 0) {
                const grid = document.createElement('div');
                grid.className = 'evaluations-grid';

                grid.innerHTML = evaluations.map(eval => {
                    const dateEvaluation = new Date(eval.date_evaluation + 'T' + eval.heure_evaluation);
                    return `
                    <div class="evaluation-item ratee">
                        <div class="evaluation-titre">${eval.titre}</div>
                        <div class="evaluation-info">
                            <div class="evaluation-info-row">
                                <div class="evaluation-info-label">Module :</div>
                                <div class="evaluation-info-value">${eval.module}</div>
                            </div>
                            <div class="evaluation-info-row">
                                <div class="evaluation-info-label">Date :</div>
                                <div class="evaluation-info-value">${dateEvaluation.toLocaleDateString('fr-FR')}</div>
                            </div>
                            <div class="evaluation-info-row">
                                <div class="evaluation-info-label">Heure :</div>
                                <div class="evaluation-info-value">${dateEvaluation.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <div class="evaluation-info-row">
                                <div class="evaluation-info-label">Parcours :</div>
                                <div class="evaluation-info-value">${eval.niveau}</div>
                            </div>
                            <div class="evaluation-info-row">
                                <div class="evaluation-info-label">Durée :</div>
                                <div class="evaluation-info-value">${eval.duree_evaluation} minutes</div>
                            </div>
                        </div>
                    </div>`;
                }).join('');

                evaluationsRateesDiv.innerHTML = '';
                evaluationsRateesDiv.appendChild(grid);
            } else {
                const niveauSelect = document.getElementById('niveau-etudiant');
                const moduleSelect = document.getElementById('module-etudiant');
                const niveauValue = niveauSelect?.value || '';
                const moduleValue = moduleSelect?.value || '';
                evaluationsRateesDiv.innerHTML = `
                    <div class="no-evaluations">
                        Aucune évaluation ratée
                    </div>
                `;
            }
        } else {
            throw new Error(data.message || 'Erreur lors de la récupération des évaluations ratées');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des évaluations ratées:', error);
        evaluationsRateesDiv.innerHTML = `
            <div class="error-message">
                Une erreur est survenue lors de la récupération des évaluations ratées
            </div>
        `;
    }
}
