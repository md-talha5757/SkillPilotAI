const IndustryDemand = require('../models/IndustryDemand');

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
