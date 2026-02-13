const express = require('express');
const router = express.Router();
const auth = require('./auth'); // Assuming auth middleware is here or exported properly
const UserPrediction = require('../models/UserPrediction');
const jwt = require('jsonwebtoken');

// Middleware to verify token (if not centralized)
const verifyToken = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// @route   POST api/user-predictions/save
// @desc    Save a user prediction
// @access  Private
router.post('/save', verifyToken, async (req, res) => {
    try {
        const { matchDate, teamA, teamB, predictedWinner, starPlayers, leagueId } = req.body;

        // Basic validation
        if (!predictedWinner || !starPlayers) {
            return res.status(400).json({ msg: 'Please provide winner and star players.' });
        }

        if (starPlayers.length === 0) {
            return res.status(400).json({ msg: 'Please select at least one player.' });
        }

        const newPrediction = new UserPrediction({
            userId: req.user.id,
            matchDate,
            teamA,
            teamB,
            predictedWinner,
            starPlayers,
            leagueId: leagueId || null
        });

        const savedPrediction = await newPrediction.save();
        res.json(savedPrediction);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/user-predictions/:id/result
// @desc    Update actual result of a match
// @access  Private
router.put('/:id/result', verifyToken, async (req, res) => {
    try {
        const { actualWinner } = req.body;
        const prediction = await UserPrediction.findById(req.params.id);

        if (!prediction) return res.status(404).json({ msg: 'Prediction not found' });

        // Ensure user owns this prediction
        if (prediction.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        prediction.actualWinner = actualWinner;
        await prediction.save();
        res.json(prediction);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/user-predictions/my
// @desc    Get logged-in user's predictions
// @access  Private
router.get('/my', verifyToken, async (req, res) => {
    try {
        const { leagueId } = req.query;
        let query = { userId: req.user.id };
        if (leagueId) {
            query.leagueId = leagueId === 'null' ? null : leagueId;
        }
        const predictions = await UserPrediction.find(query).sort({ createdAt: -1 });
        res.json(predictions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
