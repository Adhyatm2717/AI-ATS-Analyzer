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

    if (dropZone && resumeInput) {
        dropZone.addEventListener('click', () => resumeInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary)';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            if (e.dataTransfer.files.length) {
                const file = e.dataTransfer.files[0];
                const dt = new DataTransfer();
                dt.items.add(file);
                resumeInput.files = dt.files;
                updateFileInfo(file);
            }
        });

        resumeInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                updateFileInfo(e.target.files[0]);
            }
        });
    }

    function updateFileInfo(file) {
        if (!fileInfo) return;
        const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf');
        const isDOCX = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.toLowerCase().endsWith('.docx');
        
        if (!isPDF && !isDOCX) {
            fileInfo.innerHTML = `<span style="color: #f87171;">Error: Please upload a strictly PDF or DOCX format document.</span>`;
            resumeInput.value = ""; // clear
        } else {
            fileInfo.innerHTML = `<span style="color: var(--primary); font-weight: 700;">${file.name}</span> detected. Ready.`;
        }
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const file = resumeInput.files[0];
            const jobDesc = document.getElementById('job-description').value.trim();

            if (!file) {
                alert('Mission Critical: Please select a PDF resume file.');
                return;
            }

            const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf');
            const isDOCX = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.toLowerCase().endsWith('.docx');

            if (!isPDF && !isDOCX) {
                alert('Mission Critical: Resume must be a valid PDF or DOCX format.');
                return;
            }

            if (!jobDesc) {
                alert('Mission Critical: Please paste the target job description.');
                return;
            }

            setLoading(true);

            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const base64String = event.target.result.split(',')[1];
                        
                        const response = await fetch('/api/analyze', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                resume_base64: base64String,
                                resume_filename: file.name,
                                job_description: jobDesc
                            })
                        });

                        if (!response.ok) {
                            const err = await response.text();
                            throw new Error(err);
                        }

                        const data = await response.json();
                        
                        // MULTI-PAGE FLOW: Save and redirect
                        localStorage.setItem('atsAnalysis', JSON.stringify(data));
                        window.location.href = 'results.html';

                    } catch (error) {
                        console.error('System error:', error);
                        alert('Analysis failed: ' + error.message);
                        setLoading(false);
                    }
                };
                reader.onerror = () => {
                    alert('Error reading the file natively.');
                    setLoading(false);
                };
                reader.readAsDataURL(file);

            } catch (error) {
                console.error('System error:', error);
                alert('Analysis failed: ' + error.message);
                setLoading(false);
            }
        });
    }

    function setLoading(isLoading) {
        if (!analyzeBtn) return;
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
});
