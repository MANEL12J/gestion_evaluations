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
                    const dureeMinutes = parseInt(eval.duree_evaluation, 10);
                    const dateFinEvaluation = new Date(dateEvaluation.getTime() + dureeMinutes * 60000);
                    const now = new Date();

                    const isAvailable = now >= dateEvaluation && now <= dateFinEvaluation;

                    const actionHtml = isAvailable
                        ? `<a href="passer_evaluation.html?id=${eval.id}" class="btn btn-primary">
                               <i class='bx bx-play'></i> Passer l'évaluation
                           </a>`
                        : `<div class="text-muted">Non disponible</div>`;

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
                            ${actionHtml}
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