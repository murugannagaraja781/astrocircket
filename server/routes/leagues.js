const express = require('express');
const router = express.Router();
const League = require('../models/League');
const jwt = require('jsonwebtoken');

// Middleware to verify token
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

// @route   POST api/leagues
// @desc    Create a new league
// @access  Private
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ msg: 'Name is required' });

        const newLeague = new League({
            name,
            description,
            userId: req.user.id
        });

        const league = await newLeague.save();
        res.json(league);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/leagues
// @desc    Get all leagues for the user
// @access  Private
router.get('/', verifyToken, async (req, res) => {
    try {
        const leagues = await League.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(leagues);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/leagues/:id
// @desc    Delete a league
// @access  Private
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const league = await League.findById(req.params.id);
        if (!league) return res.status(404).json({ msg: 'League not found' });

        if (league.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        await league.deleteOne();
        res.json({ msg: 'League removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
