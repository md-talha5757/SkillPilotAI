const IndustryDemand = require('../models/IndustryDemand');
const User = require('../models/User');

// POST /api/industry/demand
exports.createDemand = async (req, res) => {
  try {
    const { companyName, role, skillRequired } = req.body;
    if (!companyName || !role || !skillRequired || !skillRequired.length) {
      return res.status(400).json({ message: 'companyName, role, aur skillRequired (array) required hain' });
    }
    const demand = await IndustryDemand.create({ companyName, role, skillRequired });
    res.status(201).json(demand);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/industry/demand
exports.getAllDemand = async (req, res) => {
  try {
    const demands = await IndustryDemand.find().sort({ postedAt: -1 });
    res.json(demands);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/industry/demand/aggregate
exports.getAggregateDemand = async (req, res) => {
  try {
    const aggregate = await IndustryDemand.aggregate([
      { $unwind: '$skillRequired' },
      { $group: { _id: '$skillRequired', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { skill: '$_id', count: 1, _id: 0 } }
    ]);
    res.json(aggregate);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/industry/match-scores
// Requires logged-in user's token. "Skills the student has" = roadmapSteps[i] for
// every index i that's in completedSteps (matches your real schema — no separate
// status field). Compares that against each posted industry demand's required skills.
exports.getMatchScores = async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // req.user set by auth middleware
    if (!user) return res.status(404).json({ message: 'User not found' });

    const completedSkills = (user.completedSteps || [])
      .map(index => (user.roadmapSteps[index] || '').toLowerCase().trim())
      .filter(Boolean);

    const demands = await IndustryDemand.find().sort({ postedAt: -1 });

    const scored = demands.map(demand => {
      const required = demand.skillRequired.map(s => s.toLowerCase().trim());
      const matched = required.filter(skill =>
        completedSkills.some(owned => owned.includes(skill) || skill.includes(owned))
      );
      const matchPercent = required.length
        ? Math.round((matched.length / required.length) * 100)
        : 0;

      return {
        _id: demand._id,
        companyName: demand.companyName,
        role: demand.role,
        skillRequired: demand.skillRequired,
        matchPercent
      };
    });

    scored.sort((a, b) => b.matchPercent - a.matchPercent);
    res.json(scored);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
