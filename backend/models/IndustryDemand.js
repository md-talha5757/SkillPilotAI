const mongoose = require('mongoose');

const industryDemandSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  skillRequired: { type: [String], required: true },
  postedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IndustryDemand', industryDemandSchema);
