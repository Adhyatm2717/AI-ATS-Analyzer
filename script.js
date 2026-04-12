document.addEventListener('DOMContentLoaded', () => {
    // 1. PREMIUM SCROLL REVEAL
    const reveal = () => {
        const reveals = document.querySelectorAll('.reveal');
        reveals.forEach(element => {
            const windowHeight = window.innerHeight;
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 100;
            
            if (elementTop < windowHeight - elementVisible) {
                element.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', reveal);
    reveal();

    // 2. STICKY NAV REFINEMENT
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. SMOOTH NAVIGATION
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = 100;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 4. CORE ANALYSIS LOGIC
    const dropZone = document.getElementById('drop-zone');
    const resumeInput = document.getElementById('resume-input');
    const fileInfo = document.getElementById('file-info');
    const form = document.getElementById('analyze-form');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loader = document.getElementById('loader');
    const resultsSection = document.getElementById('results-section');

    const scoreVal = document.getElementById('score-val');
    const scoreCircle = document.getElementById('score-circle-path');
    const matchingSkillsContainer = document.getElementById('matching-skills');
    const missingSkillsContainer = document.getElementById('missing-skills');
    const suggestionsList = document.getElementById('suggestions-list');

    // Circumference of circle (r=90) -> 2 * PI * 90 = 565.48
    const CIRCUMFERENCE = 565.48;

    dropZone.addEventListener('click', () => resumeInput.click());

    resumeInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) updateFileInfo(file);
    });

    function updateFileInfo(file) {
        fileInfo.innerHTML = `<span style="color: var(--primary); font-weight: 700;">${file.name}</span> detected. Ready.`;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = resumeInput.files[0];
        const jobDesc = document.getElementById('job-description').value;

        if (!file) {
            alert('Mission Critical: Please upload your resume first.');
            return;
        }

        setLoading(true);
        resultsSection.style.display = 'none';

        try {
            const formData = new FormData();
            formData.append('resume', file);
            formData.append('job_description', jobDesc);

            const response = await fetch('https://YOUR-N8N-WEBHOOK', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('System error.');

            const data = await response.json();
            renderResults(data);

        } catch (error) {
            console.error('Simulating response for premium demo...');
            setTimeout(() => {
                const mockData = {
                    score: 92,
                    matching_skills: ['Senior Leadership', 'AI/ML Systems', 'Stakeholder Management', 'System Architecture'],
                    missing_skills: ['Advanced Cloud Cost Opt.', 'Distributed Ledger Tech'],
                    suggestions: [
                        'Your technical depth is excellent; consider leading with your architecture achievements.',
                        'The JD emphasizes budgeting; add a metric regarding P&L management.',
                        'Standardize your date format to (YYYY) for 100% parsing accuracy across legacy systems.'
                    ]
                };
                renderResults(mockData);
                setLoading(false);
            }, 2500);
        }
    });

    function setLoading(isLoading) {
        const btnContent = document.getElementById('btn-content');
        if (isLoading) {
            analyzeBtn.disabled = true;
            loader.style.display = 'inline-block';
            btnContent.firstChild.textContent = 'Scanning neural networks... ';
        } else {
            analyzeBtn.disabled = false;
            loader.style.display = 'none';
            btnContent.firstChild.textContent = 'Run Deep Analysis';
        }
    }

    function renderResults(data) {
        setLoading(false);
        resultsSection.style.display = 'block';
        
        // 5. ANIMATE SCORE & SVG CIRCLE
        animateValue(scoreVal, 0, data.score, 1500);
        
        // SVG Offset Calculation
        const offset = CIRCUMFERENCE - (data.score / 100) * CIRCUMFERENCE;
        scoreCircle.style.strokeDashoffset = offset;

        // Render Lists
        renderTags(matchingSkillsContainer, data.matching_skills, 'asset-tag');
        renderTags(missingSkillsContainer, data.missing_skills, 'vulnerability-tag');
        
        suggestionsList.innerHTML = '';
        data.suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.style.cssText = 'padding: 1rem 0; color: var(--text-muted); display: flex; gap: 1rem; border-bottom: 1px solid var(--glass-border); font-size: 0.95rem;';
            li.innerHTML = `<span style="color: var(--accent-cyan); font-weight: 800;">❱</span> ${suggestion}`;
            suggestionsList.appendChild(li);
        });

        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function renderTags(container, tags, typeClass) {
        container.innerHTML = '';
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.style.cssText = 'padding: 0.5rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 50px; font-size: 0.8rem; font-weight: 500;';
            span.textContent = tag;
            container.appendChild(span);
        });
    }

    function animateValue(obj, start, end, duration) {
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
