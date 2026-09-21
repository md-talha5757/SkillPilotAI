const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper: creates a login token for a given user id.
// This token proves "this person is logged in" without needing a password every time.
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// Helper: shapes a Mongoose user document into the safe object we send to the frontend.
// One place to update whenever a new field needs to reach the client.
function toSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    goal: user.goal,
    roadmapSteps: user.roadmapSteps,
    completedSteps: user.completedSteps,
    careerReadiness: user.careerReadiness,
    roadmapProgress: user.roadmapProgress,
    dayStreak: user.dayStreak,
  };
}

// POST /api/auth/register
// Creates a new user account
async function registerUser(req, res) {
  try {
    const { name, email, password, goal } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Never store plain-text passwords — hash it first
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      goal: goal || '', // empty = no goal chosen yet
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
}

// POST /api/auth/login
// Logs an existing user in
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
}

// GET /api/auth/me  (protected route — needs a valid token)
// Returns the currently logged-in user's info
async function getMe(req, res) {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching user', error: err.message });
  }
}

// PATCH /api/auth/profile  (protected)
// Used for manually changing the goal WITHOUT regenerating a roadmap
// (the AI roadmap generation endpoint at POST /api/ai/roadmap handles goal + roadmap together)
async function updateProfile(req, res) {
  try {
    const { goal } = req.body;

    if (!goal) {
      return res.status(400).json({ message: 'Goal is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { goal },
      { new: true } // return the updated document, not the old one
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating profile', error: err.message });
  }
}

// PATCH /api/auth/toggle-step  (protected)
// Marks a roadmap step as done or undone. Recalculates roadmapProgress %
// and dayStreak (a real "did something today" streak, not decorative).
async function toggleStepComplete(req, res) {
  try {
    const { stepIndex } = req.body;

    if (typeof stepIndex !== 'number') {
      return res.status(400).json({ message: 'stepIndex (a number) is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.roadmapSteps || stepIndex < 0 || stepIndex >= user.roadmapSteps.length) {
      return res.status(400).json({ message: 'Invalid stepIndex for this roadmap' });
    }

    // Toggle: remove if already marked complete, add if not
    const alreadyDone = user.completedSteps.includes(stepIndex);
    if (alreadyDone) {
      user.completedSteps = user.completedSteps.filter((i) => i !== stepIndex);
    } else {
      user.completedSteps.push(stepIndex);
    }

    // Recalculate roadmap progress as a real percentage
    user.roadmapProgress = Math.round((user.completedSteps.length / user.roadmapSteps.length) * 100);

    // Recalculate day streak — only when marking something DONE (not when un-checking)
    if (!alreadyDone) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null;
      if (lastActivity) lastActivity.setHours(0, 0, 0, 0);

      if (!lastActivity) {
        user.dayStreak = 1; // first ever activity
      } else {
        const dayDiff = Math.round((today - lastActivity) / (1000 * 60 * 60 * 24));
        if (dayDiff === 0) {
          // already did something today — streak doesn't change
        } else if (dayDiff === 1) {
          user.dayStreak += 1; // consecutive day — streak continues
        } else {
          user.dayStreak = 1; // missed a day — streak resets
        }
      }
      user.lastActivityDate = new Date();
    }

    await user.save();

    res.json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating step progress', error: err.message });
  }
}

module.exports = { registerUser, loginUser, getMe, updateProfile, toggleStepComplete };
