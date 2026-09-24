const express = require('express');
const router = express.Router();
const { createDemand, getAllDemand, getAggregateDemand, getMatchScores } = require('../controllers/industryController');

// ⚠️ CHECK THIS LINE: point it to whichever file protects your other routes
// (the one used for /auth/me). If your file/export name is different, just
// fix this one require line — nothing else needs to change.
const auth = require('../middleware/authMiddleware');

router.post('/demand', createDemand);
router.get('/demand', getAllDemand);
router.get('/demand/aggregate', getAggregateDemand);
router.get('/match-scores', auth, getMatchScores);

module.exports = router;
