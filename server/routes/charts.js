const express = require('express');
const router = express.Router();
const { getBirthChart } = require('../controllers/chartController');
const auth = require('../middleware/auth');

// Protected route - only logged in (and approved) users can access
router.post('/birth-chart', auth, getBirthChart);

module.exports = router;
