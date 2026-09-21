const express = require('express');
const router = express.Router();
const { getCourseRecommendations } = require('../controllers/courseController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getCourseRecommendations);

module.exports = router;
