import 'dotenv/config';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { resume_base64, resume_filename, job_description } = req.body;
    
    if (!resume_base64 || !resume_filename) {
      return res.status(400).json({ error: 'Invalid input: Missing resume.' });
    }

    if (!job_description || job_description.trim() === '') {
      return res.status(400).json({ error: 'Invalid input: Missing job_description' });
    }

    // PDF & DOCX Extraction Note: Instead of files.resume.path, we use raw Buffer
    let resume_text = '';
    try {
      const dataBuffer = Buffer.from(resume_base64, 'base64');
      const isDocx = resume_filename.toLowerCase().endsWith('.docx');
      
      if (isDocx) {
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        resume_text = result.value;
      } else {
        const pdfData = await pdf(dataBuffer);
        resume_text = pdfData.text;
      }
    } catch (err) {
      console.error('Failed to parse file:', err);
      throw new Error("PARSING_ERROR: " + err.message);
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('API Key missing in environment.');
      return res.status(500).json({ error: 'Internal Server Error: Missing GROQ_API_KEY.' });
    }

    const MAX_CHAR_LIMIT = 20000;
    const safe_resume_text = resume_text.length > MAX_CHAR_LIMIT 
      ? resume_text.substring(0, MAX_CHAR_LIMIT) 
      : resume_text;

    const safe_job_desc = job_description.length > MAX_CHAR_LIMIT 
      ? job_description.substring(0, MAX_CHAR_LIMIT) 
      : job_description;

    const systemPrompt = `You are an advanced ATS system and interview coach.

Return ONLY valid JSON. No explanation or markdown.

Rules:
* Missing skills must come ONLY from the job description.
* Learning recommendations must directly map to missing skills.
* Questions must be based on both strengths and gaps.
* If any field is missing, return default empty values.

Return exactly this JSON structure:
{
  "score": number, // 0-100 rating
  "matching_skills": [string],
  "missing_skills": [string],
  "suggestions": [string],
  "learning_recommendations": [string],
  "questions": [string] // Exactly 10 questions
}`;

    const userPrompt = `Job Description:\n${safe_job_desc}\n\nResume:\n${safe_resume_text}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          response_format: { type: "json_object" },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.5,
        }),
        signal: controller.signal
      });
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error('GROQ_FETCH_TIMEOUT');
      }
      throw new Error("GROQ_FETCH_ERROR: " + fetchError.message);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Groq API Error (${response.status}):`, errorData);
      return res.status(502).json({ error: 'Bad Gateway: Failed to communicate with Groq API', details: errorData });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let parsedData = {};
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      return res.status(502).json({ 
        error: 'Bad Gateway: Invalid JSON returned from AI model', 
        raw_response: content 
      });
    }
    
    const deduplicate = arr => Array.isArray(arr) ? [...new Set(arr)] : [];

    let finalScore = typeof parsedData.score === 'number' ? parsedData.score : 0;
    finalScore = Math.min(Math.max(finalScore, 0), 100);

    const finalMatchingSkills = deduplicate(parsedData.matching_skills);
    const finalMissingSkills = deduplicate(parsedData.missing_skills);
    const finalLearningRecs = deduplicate(parsedData.learning_recommendations);

    let finalSuggestions = Array.isArray(parsedData.suggestions) 
      ? parsedData.suggestions.filter(item => typeof item === 'string')
      : [];
    if (finalSuggestions.length === 0) {
      finalSuggestions.push("Consider formatting your resume to be more ATS-friendly and quantify your professional achievements.");
    }

    let finalQuestions = Array.isArray(parsedData.questions) ? parsedData.questions : [];
    const fallbackQuestions = [
      "Can you describe a challenging project you worked on recently?",
      "How do you prioritize tasks when facing tight deadlines?",
      "Tell me about a time you had to learn a new technology quickly.",
      "How do you handle disagreements with team members?",
      "What is your approach to debugging complex issues?",
      "Describe a time you showed leadership or took initiative.",
      "How do you stay updated with industry trends?",
      "What do you consider your greatest professional achievement?",
      "How do you approach communicating technical concepts to non-technical stakeholders?",
      "Where do you see your career heading in the next few years?"
    ];

    while(finalQuestions.length < 10) {
      finalQuestions.push(fallbackQuestions[finalQuestions.length % fallbackQuestions.length]);
    }
    if(finalQuestions.length > 10) {
      finalQuestions = finalQuestions.slice(0, 10);
    }

    const finalResponse = {
      score: finalScore,
      matching_skills: finalMatchingSkills,
      missing_skills: finalMissingSkills,
      suggestions: finalSuggestions,
      learning_recommendations: finalLearningRecs,
      questions: finalQuestions
    };

    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error('Critical API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
