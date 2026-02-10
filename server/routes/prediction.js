const express = require('express');
const router = express.Router();
const { evaluatePrediction } = require('../utils/ruleEngine');
const { getLagnaTimeline } = require('../utils/astroCalculator');
const Player = require('../models/Player');

/**
 * @route POST /api/prediction/evaluate
 * @desc Evaluate Batting and Bowling prediction for a player in a specific match
 */
router.post('/evaluate', async (req, res) => {
    try {
        const { playerId, matchDate, matchTime, location } = req.body;

        if (!playerId || !matchDate || !matchTime || !location) {
            return res.status(400).json({ message: 'Missing required fields: playerId, matchDate, matchTime, location' });
        }

        // 1. Fetch Player
        const player = await Player.findOne({ id: playerId });
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }
        if (!player.birthChart) {
            return res.status(400).json({ message: 'Player birth chart data missing' });
        }

        // 2. Prepare Match Params
        console.log(`Evaluating Prediction for: Player=${playerId}, Date=${matchDate}, Time=${matchTime}`);

        // matchDate: "2025-12-30", matchTime: "14:30"
        const [year, month, day] = matchDate.split('-').map(Number);
        const [hour, minute] = matchTime.split(':').map(Number);

        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
            return res.status(400).json({ message: 'Invalid Date or Time format' });
        }

        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lng);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ message: 'Invalid Location (Latitude/Longitude)' });
        }

        const tz = (location.timezone !== undefined && location.timezone !== null)
            ? parseFloat(location.timezone)
            : 5.5; // Default IST only if missing

        // Calculate Lagna Timeline (Dynamic Lagna)
        const lagnaTimeline = getLagnaTimeline(year, month, day, hour, minute, lat, lng, tz, 4); // 4 hours duration

        const matchParams = {
            year,
            month,
            day,
            hour,
            minute,
            latitude: lat,
            longitude: lng,
            timezone: tz,
            matchLagnas: lagnaTimeline
        };

        console.log('Using Strict Match Params with Timeline:', JSON.stringify(matchParams));

        // 3. Prepare Chart Data
        const chartRoot = player.birthChart.data || player.birthChart;
        // We need an object with planet names as keys and longitudes (or objects with longitude property) as values.
        // Priority: positions (clean numbers), rawPlanets (strings/details), planets (might be house map).
        const planetsData = chartRoot.positions || chartRoot.rawPlanets || chartRoot.planets;

        if (!planetsData) {
            return res.status(400).json({ message: 'Player birth chart planetary positions missing' });
        }

        const playerChart = { planets: planetsData };

        // 4. Evaluate
        const result = await evaluatePrediction(playerChart, matchParams);

        // Append Timeline to response for UI
        result.lagnaTimeline = lagnaTimeline;

        res.json({
            player: player.name,
            matchDate,
            prediction: result
        });

    } catch (err) {
        console.error('Prediction Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;
