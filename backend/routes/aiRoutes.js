const express = require('express');
const router = express.Router();
const { generateRoadmap, chatWithMentor } = require('../controllers/aiController');
const protect = require('../middleware/authMiddleware');

router.post('/roadmap', protect, generateRoadmap);
router.post('/chat', protect, chatWithMentor);

module.exports = router;
