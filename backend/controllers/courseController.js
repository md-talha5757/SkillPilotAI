const { callGemini } = require('../utils/gemini');

// Calls YouTube Data API v3 for real, live video results.
// If YOUTUBE_API_KEY isn't set, this quietly returns an empty list instead of crashing —
// the platform suggestions (from Gemini) still work either way.
async function searchYouTube(topic) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === 'your_youtube_api_key_here') {
    return [];
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&type=video&q=${encodeURIComponent(topic + ' tutorial')}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();

  return (data.items || []).map((item) => ({
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    thumbnail: item.snippet.thumbnails?.medium?.url || '',
  }));
}

// Asks Gemini to suggest REAL, well-known learning platforms/resources for the topic
// (never invented — the prompt explicitly forbids making up fake course names/links).
async function suggestPlatforms(topic) {
  const systemInstruction = `You are a learning-resource curator for a career platform.
Given a skill/topic, suggest 4 to 6 REAL, well-known learning resources — a mix of free and paid —
such as freeCodeCamp, Coursera, Udemy, official documentation, Codecademy, The Odin Project, etc.
Only suggest resources that genuinely exist. NEVER invent a course name, instructor, or URL.
Respond with ONLY a JSON array, each item shaped like:
{"platform": "freeCodeCamp", "type": "Free", "why": "one short sentence on why it fits"}
No markdown, no extra text — just the JSON array.`;

  const raw = await callGemini(`Topic: ${topic}`, systemInstruction);
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// GET /api/courses?topic=...  (protected)
async function getCourseRecommendations(req, res) {
  try {
    const topic = req.query.topic;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: 'A topic is required, e.g. ?topic=React' });
    }

    const [videos, platforms] = await Promise.all([
      searchYouTube(topic).catch(() => []),
      suggestPlatforms(topic).catch(() => []),
    ]);

    res.json({ success: true, topic, videos, platforms });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching course recommendations', error: err.message });
  }
}

module.exports = { getCourseRecommendations };
