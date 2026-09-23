const express = require('express');
const router = express.Router();
const captainAstroController = require('../controllers/captainAstroController');

// Calculate match astro
router.post('/calculate', captainAstroController.calculateMatchAstro);

// Fetch match history with filters
router.get('/history', captainAstroController.getHistory);

// Save match record
router.post('/save', captainAstroController.saveMatch);

// Delete match record
router.delete('/delete/:id', captainAstroController.deleteMatch);

// Seed 74 IPL matches into DB
router.post('/seed-ipl', captainAstroController.seedIPLMatches);

// Get metadata (nakshatras, venues, captains)
router.get('/metadata', captainAstroController.getNakshatrasList);

module.exports = router;
