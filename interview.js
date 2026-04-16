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

    const container = document.getElementById('interview-container');
    if (!container) return;

    if (!data.questions || data.questions.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No automated questions were generated for this criteria.</p>';
        return;
    }

    // Ensure we process a maximum of 10 questions to match exact UX scaling
    const questions = data.questions.slice(0, 10);

    questions.forEach((q, index) => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            display: flex;
            gap: 1.5rem;
            align-items: flex-start;
            transition: all 0.3s ease;
        `;
        
        item.onmouseenter = () => {
            item.style.borderColor = 'var(--tertiary)';
            item.style.background = 'rgba(236, 72, 153, 0.05)';
        };
        item.onmouseleave = () => {
            item.style.borderColor = 'var(--glass-border)';
            item.style.background = 'rgba(255, 255, 255, 0.02)';
        };

        const numberBadge = document.createElement('div');
        numberBadge.style.cssText = `
            background: rgba(236, 72, 153, 0.1);
            color: var(--tertiary);
            font-weight: 800;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            flex-shrink: 0;
            font-size: 1.1rem;
        `;
        numberBadge.textContent = String(index + 1);

        const textContent = document.createElement('p');
        textContent.style.cssText = `
            color: #fff;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-top: 0.3rem;
            font-weight: 400;
        `;
        textContent.textContent = q;

        item.appendChild(numberBadge);
        item.appendChild(textContent);
        container.appendChild(item);
    });
});
