document.addEventListener('DOMContentLoaded', () => {
    const dataStr = localStorage.getItem('atsAnalysis');
    
    if (!dataStr) {
        window.location.href = 'index.html';
        return;
    }

    let data;
    try {
        data = JSON.parse(dataStr);
    } catch(e) {
        console.error('Failed to reconstruct localStorage mapping.');
        window.location.href = 'index.html';
        return;
    }

    const scoreVal = document.getElementById('score-val');
    const scoreCircle = document.getElementById('score-circle-path');
    const matchingSkillsContainer = document.getElementById('matching-skills');
    const missingSkillsContainer = document.getElementById('missing-skills');
    const suggestionsList = document.getElementById('suggestions-list');
    const learningRecommendationsList = document.getElementById('learning-recommendations-list');

    const CIRCUMFERENCE = 565.48;

    // ANIMATE SCORE & SVG CIRCLE
    animateValue(scoreVal, 0, data.score || 0, 1500);
    
    const scoreNum = data.score || 0;
    const offset = CIRCUMFERENCE - (scoreNum / 100) * CIRCUMFERENCE;
    if (scoreCircle) {
        scoreCircle.style.strokeDashoffset = offset;
    }

    // LIST RENDERERS
    renderTags(matchingSkillsContainer, data.matching_skills, 'asset-tag');
    renderTags(missingSkillsContainer, data.missing_skills, 'vulnerability-tag');
    
    if (suggestionsList && data.suggestions) {
        suggestionsList.innerHTML = '';
        data.suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.style.cssText = 'padding: 1rem 0; color: var(--text-muted); display: flex; gap: 1rem; border-bottom: 1px solid var(--glass-border); font-size: 0.95rem;';
            li.innerHTML = `<span style="color: var(--accent-cyan); font-weight: 800;">❱</span> ${suggestion}`;
            suggestionsList.appendChild(li);
        });
    }

    if (learningRecommendationsList && data.learning_recommendations) {
        learningRecommendationsList.innerHTML = '';
        data.learning_recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.style.cssText = 'padding: 1rem 0; color: var(--text-muted); display: flex; gap: 1rem; border-bottom: 1px solid var(--glass-border); font-size: 0.95rem;';
            li.innerHTML = `<span style="color: var(--primary); font-weight: 800;">⚡</span> ${rec}`;
            learningRecommendationsList.appendChild(li);
        });
    }

    function renderTags(container, tags, typeClass) {
        if (!container) return;
        container.innerHTML = '';
        if (!tags || tags.length === 0) {
            container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">None tracked</span>';
            return;
        }
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.style.cssText = 'padding: 0.5rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 50px; font-size: 0.8rem; font-weight: 500;';
            span.textContent = tag;
            container.appendChild(span);
        });
    }

    function animateValue(obj, start, end, duration) {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
});
