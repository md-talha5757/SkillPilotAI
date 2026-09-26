const User = require('../models/User');

// GET /api/academia/skill-gaps
// Uses EXISTING student data — roadmapSteps (step names) + completedSteps (indices
// the student has checked off). A step is a "gap" if it's in roadmapSteps but its
// index is NOT in completedSteps. Tallies this across all students.
exports.getSkillGaps = async (req, res) => {
  try {
    const users = await User.find({}, 'roadmapSteps completedSteps roadmapProgress');

    const gapCounts = {};
    users.forEach(user => {
      const steps = user.roadmapSteps || [];
      const completed = user.completedSteps || [];
      steps.forEach((stepName, index) => {
        if (!completed.includes(index)) {
          gapCounts[stepName] = (gapCounts[stepName] || 0) + 1;
        }
      });
    });

    const topGaps = Object.entries(gapCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([skill, count]) => ({ skill, count }));

    const totalStudents = users.length;
    const avgCompletion = totalStudents
      ? Math.round(users.reduce((sum, u) => sum + (u.roadmapProgress || 0), 0) / totalStudents)
      : 0;

    res.json({ topGaps, totalStudents, avgCompletion });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
