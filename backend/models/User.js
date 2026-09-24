const mongoose = require('mongoose');

// This defines what a "user" looks like in the database.
// Every signup creates one document matching this shape.
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // no two users can have the same email
    lowercase: true,
  },
  password: {
    type: String,
    required: true, // this will store the HASHED password, never plain text
  },
  goal: {
    type: String,
    default: '', // empty means "user hasn't chosen a goal yet" — triggers goal-selection screen on frontend
  },
  careerReadiness: {
    type: Number,
    default: 0,
  },
  roadmapProgress: {
    type: Number,
    default: 0,
  },
  roadmapSteps: {
    type: [String], // AI-generated step names, e.g. ["HTML", "CSS", "JavaScript", ...]
    default: [],
  },
  completedSteps: {
    type: [Number], // indices into roadmapSteps that the user has checked off as "done"
    default: [],
  },
  verifiedSkills: {
    // Quiz + mini-project verified skills — a completed checkbox alone doesn't add here.
    // Only added once the user passes the AI quiz (70%+) AND submits a mini-project.
    type: [{
      skillName: String,
      score: Number,
      projectChosen: String,
      verifiedAt: Date,
    }],
    default: [],
  },
  lastActivityDate: {
    type: Date, // last time the user marked any step complete — used to calculate dayStreak
    default: null,
  },
  dayStreak: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
