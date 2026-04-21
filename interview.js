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
            flex-direction: column;
            gap: 1.5rem;
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

        const questionRow = document.createElement('div');
        questionRow.style.cssText = `
            display: flex;
            gap: 1.5rem;
            align-items: flex-start;
        `;

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
            flex: 1;
        `;
        textContent.textContent = q;

        questionRow.appendChild(numberBadge);
        questionRow.appendChild(textContent);

        const answerArea = document.createElement('textarea');
        answerArea.className = 'premium-area';
        answerArea.style.minHeight = '100px';
        answerArea.placeholder = 'Type your answer here...';

        const controlsRow = document.createElement('div');
        controlsRow.style.display = 'flex';
        controlsRow.style.justifyContent = 'flex-end';
        
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn btn-glow';
        submitBtn.style.padding = '0.6rem 1.5rem';
        submitBtn.style.fontSize = '0.9rem';
        submitBtn.textContent = 'Submit Answer';
        
        const feedbackDiv = document.createElement('div');
        feedbackDiv.style.cssText = `
            display: none;
            padding: 1.5rem;
            background: rgba(15, 23, 42, 0.6);
            border-radius: 12px;
            border: 1px solid var(--glass-border);
            margin-top: 1rem;
            flex-direction: column;
            gap: 1rem;
            animation: fadeIn 0.5s ease forwards;
        `;

        submitBtn.onclick = async () => {
            const answer = answerArea.value.trim();
            if (!answer) {
                alert('Please provide an answer first.');
                return;
            }
            
            submitBtn.textContent = 'Evaluating...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';

            try {
                const res = await fetch('/api/evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: q, answer })
                });

                if (!res.ok) throw new Error('Evaluation failed');
                
                const data = await res.json();
                
                feedbackDiv.style.display = 'flex';
                feedbackDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="font-size: 2.5rem; font-weight: 800; color: ${data.score >= 70 ? '#22c55e' : (data.score >= 40 ? '#f59e0b' : '#ef4444')};">${data.score}/100</div>
                        <div style="color: var(--text-muted); font-size: 0.95rem; font-weight: 500;">Evaluation<br>Score</div>
                    </div>
                    <div>
                        <strong style="color: var(--accent-cyan); display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">MISSING KEYWORDS:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${data.keywords.length > 0 ? data.keywords.map(kw => `<span style="background: rgba(34, 211, 238, 0.1); color: var(--accent-cyan); padding: 0.3rem 0.8rem; border-radius: 50px; font-size: 0.85rem; border: 1px solid rgba(34, 211, 238, 0.2);">${kw}</span>`).join('') : '<span style="color: #22c55e; font-size: 0.85rem; padding: 0.3rem 0; font-weight: 500;">None! Excellent coverage.</span>'}
                        </div>
                    </div>
                    <div>
                        <strong style="color: var(--secondary); display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">IDEAL ANSWER:</strong>
                        <p style="color: var(--text-main); font-size: 0.95rem; line-height: 1.6; background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 12px; border-left: 4px solid var(--secondary); margin: 0;">${data.correct_answer}</p>
                    </div>
                `;
                
                answerArea.disabled = true;
                answerArea.style.opacity = '0.7';
                submitBtn.style.display = 'none';

            } catch (err) {
                console.error(err);
                alert('An error occurred during evaluation. Please try again.');
                submitBtn.textContent = 'Submit Answer';
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }
        };

        controlsRow.appendChild(submitBtn);

        item.appendChild(questionRow);
        item.appendChild(answerArea);
        item.appendChild(controlsRow);
        item.appendChild(feedbackDiv);
        
        container.appendChild(item);
    });
});
