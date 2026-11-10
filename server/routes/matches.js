const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const adminAuth = require('../middleware/adminAuth');
const jwt = require('jsonwebtoken');

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

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

// @route   GET api/matches/old-matches
// @desc    Get completed/old matches with search, series filter, and stats
// @access  Public or Protected
router.get('/old-matches', async (req, res) => {
    try {
        const { search = '', series = 'all', nakshatra = 'all', page = 1, limit = 50, sort = -1 } = req.query;
        const query = { status: { $in: ['completed', 'finished'] } };

        if (series && series !== 'all') {
            query.series = series;
        }

        const andConditions = [];

        if (nakshatra && nakshatra !== 'all') {
            andConditions.push({
                $or: [
                    { nakshatra: new RegExp(nakshatra.trim(), 'i') },
                    { nakshatraTamil: new RegExp(nakshatra.trim(), 'i') }
                ]
            });
        }

        if (search && search.trim() !== '') {
            const regex = new RegExp(search.trim(), 'i');
            andConditions.push({
                $or: [
                    { teamA: regex },
                    { teamB: regex },
                    { venue: regex },
                    { series: regex },
                    { 'result.winner': regex },
                    { nakshatra: regex },
                    { nakshatraTamil: regex }
                ]
            });
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
        const skip = (pageNum - 1) * limitNum;
        const sortVal = parseInt(sort) === 1 ? 1 : -1;

        const [matches, total, seriesList, nakshatraList] = await Promise.all([
            Match.find(query).sort({ matchDate: sortVal, matchTime: -1 }).skip(skip).limit(limitNum),
            Match.countDocuments(query),
            Match.distinct('series', { status: { $in: ['completed', 'finished'] }, series: { $ne: '' } }),
            Match.distinct('nakshatra', { status: { $in: ['completed', 'finished'] }, nakshatra: { $ne: null, $ne: '' } })
        ]);

        res.json({
            success: true,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            seriesList: seriesList.filter(Boolean),
            nakshatraList: nakshatraList.filter(Boolean),
            matches
        });
        });
    } catch (err) {
        console.error('Error fetching old matches:', err);
        res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
    }
});

// @route   GET api/matches/scraped-files
// @desc    List all scraped JSON and Excel files with stats
router.get('/scraped-files', async (req, res) => {
    try {
        const dir = path.join(__dirname, '..', 'scraped_data');
        if (!fs.existsSync(dir)) {
            return res.json({ success: true, files: [] });
        }
        const filenames = fs.readdirSync(dir);
        const files = filenames.map(name => {
            const filePath = path.join(dir, name);
            const stats = fs.statSync(filePath);
            const isJson = name.endsWith('.json');
            let matchCount = null;
            if (isJson) {
                try {
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    if (Array.isArray(content)) matchCount = content.length;
                    else if (content && Array.isArray(content.matches)) matchCount = content.matches.length;
                } catch (e) {}
            }
            return {
                name,
                size: stats.size,
                sizeFormatted: (stats.size / 1024).toFixed(1) + ' KB',
                modified: stats.mtime,
                type: name.endsWith('.xlsx') ? 'excel' : 'json',
                matchCount
            };
        });

        res.json({ success: true, files });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
});

// @route   GET api/matches/download-file/:filename
// @desc    Download scraped JSON or Excel file
router.get('/download-file/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const safeName = path.basename(filename);
        const filePath = path.join(__dirname, '..', 'scraped_data', safeName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ msg: 'File not found' });
        }
        res.download(filePath, safeName);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// @route   POST api/matches/scrape-series
router.post('/scrape-series', async (req, res) => {
    try {
        const { url, saveToDb = true } = req.body;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ success: false, msg: 'Valid Cricbuzz series URL is required' });
        }

        const scriptPath = path.join(__dirname, '..', 'scripts', 'bulk_series_scraper.js');
        const dbFlag = saveToDb ? '--save-to-db' : '';
        const cmd = `node "${scriptPath}" --url "${url.replace(/"/g, '')}" ${dbFlag}`;

        exec(cmd, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
            if (error) {
                console.error('Scraper exec error:', error);
            } else {
                console.log('Scraper finished output:\n', stdout);
            }
        });

        res.json({
            success: true,
            msg: 'Scraping started! Matches are being parsed and saved to database & Excel file.'
        });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
});

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
