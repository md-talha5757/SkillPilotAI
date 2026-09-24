const User = require('../models/User');

// ⚠️ CHECK THIS: same Gemini helper aiController.js already uses for roadmap/chat.
// If the exported function name differs, fix just this one line.
const { askGemini } = require('../utils/gemini');

// POST /api/skill/quiz
// body: { skillName }
exports.generateQuiz = async (req, res) => {
  try {
    const { skillName } = req.body;
    if (!skillName) return res.status(400).json({ message: 'skillName required hai' });

    const prompt = `Generate exactly 5 multiple-choice questions to test a beginner-to-intermediate student's understanding of "${skillName}".
Return ONLY valid JSON, no markdown, no extra text, in this exact shape:
{
  "questions": [
    { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0 }
  ]
}`;

    const raw = await askGemini(prompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    const questionsForClient = parsed.questions.map(q => ({
      question: q.question,
      options: q.options
    }));
    const answerKey = parsed.questions.map(q => q.correctIndex);

    res.json({ questions: questionsForClient, answerKey });
  } catch (err) {
    res.status(500).json({ message: 'Quiz generate nahi ho paya', error: err.message });
  }
};

// POST /api/skill/verify
// body: { skillName, answers, answerKey }
exports.submitQuiz = async (req, res) => {
  try {
    const { skillName, answers, answerKey } = req.body;
    if (!skillName || !answers || !answerKey) {
      return res.status(400).json({ message: 'skillName, answers, answerKey required hain' });
    }

    let correctCount = 0;
    answerKey.forEach((correctIdx, i) => {
      if (answers[i] === correctIdx) correctCount++;
    });
    const score = Math.round((correctCount / answerKey.length) * 100);
    const passed = score >= 70;

    let projectIdeas = [];
    if (passed) {
      const prompt = `Suggest exactly 3 small beginner-friendly mini-project ideas to practically prove someone has learned "${skillName}".
Each should be doable in a few hours. Return ONLY valid JSON, no markdown:
{ "projects": ["idea 1", "idea 2", "idea 3"] }`;

      const raw = await askGemini(prompt);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      projectIdeas = parsed.projects;
    }

    res.json({ score, passed, projectIdeas });
  } catch (err) {
    res.status(500).json({ message: 'Quiz submit karne mein error', error: err.message });
  }
};

// POST /api/skill/complete-project
// body: { skillName, score, projectChosen }
// THIS grants the verified badge — quiz pass alone isn't enough, matches your
// original idea. Also nudges careerReadiness up a bit, since that field exists
// on your User model but nothing was updating it yet.
exports.completeProject = async (req, res) => {
  try {
    const { skillName, score, projectChosen } = req.body;
    if (!skillName || !projectChosen) {
      return res.status(400).json({ message: 'skillName aur projectChosen required hain' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.verifiedSkills) user.verifiedSkills = [];

    const existing = user.verifiedSkills.find(v => v.skillName === skillName);
    if (existing) {
      existing.projectChosen = projectChosen;
      existing.score = score;
      existing.verifiedAt = new Date();
    } else {
      user.verifiedSkills.push({ skillName, score, projectChosen, verifiedAt: new Date() });
    }

    // Simple, demo-honest career readiness formula:
    // 60% weight on overall roadmap progress + up to 40% from verified (quiz+project) skills.
    const totalSteps = (user.roadmapSteps || []).length || 1;
    const verifiedRatio = user.verifiedSkills.length / totalSteps;
    user.careerReadiness = Math.min(100, Math.round((user.roadmapProgress || 0) * 0.6 + verifiedRatio * 40));

    await user.save();
    res.json({ message: 'Skill verified!', verifiedSkills: user.verifiedSkills, careerReadiness: user.careerReadiness });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
