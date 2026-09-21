const { callGemini } = require('../utils/gemini');
const User = require('../models/User');

// POST /api/ai/roadmap  (protected)
// Takes the user's goal (any free-text skill/career, not a fixed list) and asks
// Gemini to generate a sequenced learning roadmap for it, then saves it to MongoDB.
async function generateRoadmap(req, res) {
  try {
    const { goal } = req.body;

    if (!goal || !goal.trim()) {
      return res.status(400).json({ message: 'Goal is required' });
    }

    const systemInstruction = `You are a career roadmap generator for a learning platform called SkillPilot AI.
Given ANY skill or career goal the user types (it could be anything — a tech role, a creative skill, a trade, a language, literally anything), 
output a JSON array of 8 to 12 short step names representing a logical learning order from beginner to job-ready.
Respond with ONLY the JSON array, nothing else — no markdown code fences, no explanation, no extra text.
Example output format: ["Step one", "Step two", "Step three"]`;

    const rawText = await callGemini(`Goal: ${goal}`, systemInstruction);

    // Gemini sometimes wraps JSON in ```json ... ``` even when told not to — strip that defensively
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let steps;
    try {
      steps = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(502).json({ message: 'AI returned an unexpected format, please try again', raw: cleaned });
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(502).json({ message: 'AI did not return a valid roadmap, please try again' });
    }

    // Save both the goal and the generated roadmap to the user's document
    const user = await User.findByIdAndUpdate(
      req.userId,
      { goal: goal.trim(), roadmapSteps: steps },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        goal: user.goal,
        roadmapSteps: user.roadmapSteps,
        careerReadiness: user.careerReadiness,
        roadmapProgress: user.roadmapProgress,
        dayStreak: user.dayStreak,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error generating roadmap', error: err.message });
  }
}

// POST /api/ai/chat  (protected)
// Real AI Mentor — knows the logged-in user's goal and roadmap, gives contextual replies.
async function chatWithMentor(req, res) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'A message is required' });
    }

    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roadmapContext = user.roadmapSteps && user.roadmapSteps.length
      ? `Their roadmap steps are: ${user.roadmapSteps.join(', ')}.`
      : `They haven't generated a roadmap yet.`;

    const systemInstruction = `You are the AI Mentor inside SkillPilot AI, a learning-to-earning platform.
You're talking to ${user.name}, whose career goal is "${user.goal || 'not chosen yet'}".
${roadmapContext}
Their roadmap progress is ${user.roadmapProgress}% and their career readiness score is ${user.careerReadiness}/100.
Be encouraging, concise (2-4 sentences usually), and give specific, actionable advice tied to their actual goal and roadmap.
Do not make up fake external facts (like fake course names) — keep advice general and skill-focused unless the user asks something you can answer directly.`;

    const reply = await callGemini(message, systemInstruction);

    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ message: 'Server error talking to AI Mentor', error: err.message });
  }
}

module.exports = { generateRoadmap, chatWithMentor };
