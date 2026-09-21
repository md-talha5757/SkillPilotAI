const express = require('express');
const router = express.Router();
const { createDemand, getAllDemand, getAggregateDemand } = require('../controllers/industryController');

router.post('/demand', createDemand);
router.get('/demand', getAllDemand);
router.get('/demand/aggregate', getAggregateDemand);

module.exports = router;
