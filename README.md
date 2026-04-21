# 🚀 Optimizer.AI - Advanced ATS Resume Analyzer & Mock Interviewer

A premium, modern applicant tracking system simulation tool designed to help candidates perfectly optimize their resumes against their target job descriptions, followed by a targeted mock interview setup that dynamically evaluates their technical knowledge.

## 🌐 Live Demo
*👉 [Insert Your Vercel Deployment Link Here]*

---

## ✨ Features

- **Deep ATS Simulation**: Real-time analysis of resumes against job descriptions, yielding a precise 0-100 score.
- **Dynamic File Processing**: Drag-and-drop parsing support for both `.pdf` and `.docx` file structures right in the browser.
- **Automated Skill Extraction**: Clear breakdown of matching skills, missing skills, and actionable learning recommendations.
- **Dynamic Mock Interviewer**: High-quality, dynamically generated technical interview questions automatically tailored to the candidate's specific resume and the job description.
- **Real-time Answer Evaluation**: Built-in mock interview where answers are immediately evaluated for missing keywords, accuracy, and provided an ideal standard answer to learn from.
- **Modern SaaS UI**: Best-in-class UI utilizing dark mode glassmorphism, dynamic mesh background gradients, subtle noise overlays, and floating layout micro-interactions.

---

## 🛠️ Technologies Used

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (Fetch API, DOM manipulation).
- **Backend**: Node.js via **Vercel Serverless Functions**.
- **Document Parsing**: `pdf-parse` (for PDF), `mammoth` (for DOCX).
- **AI Integration**: The **Groq API** running the `llama-3.3-70b-versatile` model for lightning-fast parsing, text extraction, and interview evaluation.

---

## 🔄 How It Works (The Core Workflow)

1. **Upload & Submit**: The user accesses the landing page (`index.html`), uploads a valid Resume PDF/DOCX, and pastes the exact Job Description.
2. **File Processing**: The frontend converts the uploaded file array into a base64 string and posts it directly to the backend (`/api/analyze.js`). 
3. **Data Extraction**: The Vercel Node backend leverages `pdf-parse` or `mammoth` alongside the uploaded buffer to reliably strip purely raw string text.
4. **AI Parsing via Groq**: The resume text and job description are sent to the Groq `Llama-3` AI model with a strict system prompt. The model processes the data under extreme speed and outputs exactly structured JSON determining score matrices, suggestions, and 5-10 hyper-custom technical interview questions.
5. **Results Presentation**: The frontend securely catches the JSON payload, temporarily saves it to browser LocalStorage, gracefully transitions to `results.html`, and animates the SVG scoring wheel and skill grids. 
6. **Mock Interview Pipeline**: The candidate can smoothly enter the `interview.html` phase where their dynamic questions are populated.
7. **Answer Evaluation**: 
    - The user types an answer.
    - Submitted to the `/api/evaluate.js` Vercel Endpoint.
    - The Groq AI instantly grades the technical accuracy of the user's answer, identifies **missing keywords**, maps out an **ideal answer**, and assigns an individual question score out of 100 which the frontend displays dynamically.

---

## 💻 Running Locally

### 1. Clone & Install
```bash
git clone https://github.com/Adhyatm2717/AI-ATS-Analyzer.git
cd AI-ATS-Analyzer
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory and securely add your Groq API key:
```env
GROQ_API_KEY=gsk_your_api_key_here
```

### 3. Start Local Server
Since this relies on Vercel Serverless Functions (`/api/*`), you should run it with the Vercel CLI locally so the endpoints route correctly:
```bash
npm install -g vercel
vercel dev
```

The system will start running securely at `localhost:3000`.
