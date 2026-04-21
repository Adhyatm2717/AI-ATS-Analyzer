import 'dotenv/config';

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
    const { question, answer } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ error: 'Missing question or answer.' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Internal Server Error: Missing GROQ_API_KEY.' });
    }

    const systemPrompt = `You are an expert technical interviewer and strict evaluator.

Return ONLY valid JSON. No explanation or markdown.

Rules:
* Evaluate the candidate's answer based on the question.
* Provide a score from 0 to 100 representing how complete and accurate the answer is.
* List important keywords or core concepts that the candidate missed. If none are missed, return an empty array.
* Provide a concise, ideal correct answer.

Return exactly this JSON structure:
{
  "score": number,
  "keywords": [string],
  "correct_answer": string
}`;

    const userPrompt = `Question:\n${question}\n\nCandidate's Answer:\n${answer}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
          temperature: 0.3,
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

    return res.status(200).json({
      score: typeof parsedData.score === 'number' ? parsedData.score : 0,
      keywords: Array.isArray(parsedData.keywords) ? parsedData.keywords : [],
      correct_answer: typeof parsedData.correct_answer === 'string' ? parsedData.correct_answer : "No correct answer provided by AI."
    });

  } catch (error) {
    console.error('Evaluate API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
