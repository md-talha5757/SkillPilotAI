const express = require('express');
const router = express.Router();
const { generateQuiz, submitQuiz, completeProject } = require('../controllers/skillVerificationController');

// ⚠️ Same as your other protected routes — point this to your real auth middleware file
const auth = require('../middleware/authMiddleware');

router.post('/quiz', auth, generateQuiz);
router.post('/verify', auth, submitQuiz);
router.post('/complete-project', auth, completeProject);

module.exports = router;
