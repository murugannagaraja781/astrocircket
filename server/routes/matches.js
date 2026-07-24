const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const adminAuth = require('../middleware/adminAuth');
const jwt = require('jsonwebtoken');

// Middleware to verify token for public/user routes
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

// @route   GET api/matches
// @desc    Get all matches
// @access  Private
router.get('/', verifyToken, async (req, res) => {
    try {
        const matches = await Match.find().sort({ matchDate: 1, matchTime: 1 });
        res.json(matches);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/matches/:id
// @desc    Get match by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ msg: 'Match not found' });

        // Hide expert prediction if not published or if we implement payment check here later
        // For now, let's keep it simple.
        res.json(match);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/matches
// @desc    Create a new match (Admin only)
// @access  Private/Admin
router.post('/', adminAuth, async (req, res) => {
    try {
        const { teamA, teamB, matchDate, matchTime, location, venue, leagueId } = req.body;

        const newMatch = new Match({
            teamA, teamB, matchDate, matchTime, location, venue, leagueId
        });

        const match = await newMatch.save();
        res.json(match);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/matches/:id/prediction
// @desc    Update expert prediction for a match (Admin only)
// @access  Private/Admin
router.put('/:id/prediction', adminAuth, async (req, res) => {
    try {
        const { predictedWinner, keyPlayers, reasoning, isPublished } = req.body;

        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ msg: 'Match not found' });

        match.expertPrediction = {
            predictedWinner,
            keyPlayers,
            reasoning,
            isPublished,
            publishedAt: isPublished ? Date.now() : match.expertPrediction.publishedAt
        };

        await match.save();
        res.json(match);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/matches/:id
// @desc    Delete a match (Admin only)
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ msg: 'Match not found' });

        await match.deleteOne();
        res.json({ msg: 'Match removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
