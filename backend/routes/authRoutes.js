const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile, toggleStepComplete } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe); // "protect" runs first to check the token
router.patch('/profile', protect, updateProfile); // goal selection saves here
router.patch('/toggle-step', protect, toggleStepComplete); // mark a roadmap step done/undone

module.exports = router;
