const express = require('express');
const router = express.Router();
const { getBirthChart } = require('../controllers/chartController');
const auth = require('../middleware/auth');

// Route - temporarily without auth for testing local calculation
router.post('/birth-chart', getBirthChart);

module.exports = router;
