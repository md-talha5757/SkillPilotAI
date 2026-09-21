const express = require('express');
const router = express.Router();
const { getJobRecommendations } = require('../controllers/jobController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getJobRecommendations);

module.exports = router;
