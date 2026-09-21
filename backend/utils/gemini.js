// Central helper for calling Google's Gemini API.
// Both the AI Mentor chatbot AND the AI roadmap generator use this same function —
// one place to fix things if Google changes the API later.

async function callGemini(userPrompt, systemInstruction) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is missing — add a real key to your .env file');
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
  const body = {
    contents: [
      { role: 'user', parts: [{ text: userPrompt }] }
    ],
  };

  if (systemInstruction) {
    body.system_instruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Pull the plain text out of Gemini's response shape
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned an unexpected response shape');
  }

  return text;
}

module.exports = { callGemini };
