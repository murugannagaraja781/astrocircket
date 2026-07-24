const express = require('express');
const router = express.Router();
const { getBirthChart, getKPTimeline } = require('../controllers/chartController');
const auth = require('../middleware/auth');

// Route - temporarily without auth for testing local calculation
router.post('/birth-chart', getBirthChart);
router.post('/kp-timeline', getKPTimeline);

module.exports = router;
