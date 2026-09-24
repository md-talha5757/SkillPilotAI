const express = require('express');
const router = express.Router();
const { getSkillGaps } = require('../controllers/academiaController');

router.get('/skill-gaps', getSkillGaps);

module.exports = router;
