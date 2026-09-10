const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');
const phonepeService = require('../utils/phonepeService');
const fcmService = require('../utils/fcmService');
const jwt = require('jsonwebtoken');

// Helper to extract user if token is present (optional auth)
const getUserFromToken = async (req) => {
    try {
        let token = req.header('x-auth-token');
        if (!token && req.header('Authorization')) {
            const authHeader = req.header('Authorization');
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
        if (!token) return null;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.user;
    } catch (e) {
        return null;
    }
};

// Require auth middleware
const requireAuth = (req, res, next) => {
    let token = req.header('x-auth-token');
    if (!token && req.header('Authorization')) {
        const authHeader = req.header('Authorization');
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    if (!token) return res.status(401).json({ msg: 'Authentication required' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Invalid or expired token' });
    }
};

const liveScoreService = require('../utils/liveScoreService');

// Helper to parse title and metadata from Cricbuzz
const parseMatchTitle = (title, defaultStatus, url = '') => {
    const cleanTitle = (title || '').replace(/\s+/g, ' ').trim();
    const parts = cleanTitle.split(',');
    const matchPart = parts[0] || '';
    const venueAndStatus = parts.slice(1).join(',');
    const venuePart = venueAndStatus.split('-')[0]?.trim() || '';
    const subStatus = venueAndStatus.split('-')[1]?.trim() || '';
    
    const teams = matchPart.split(/\s+vs\s+/i);
    const teamA = (teams[0] || 'Team A').trim();
    const teamB = (teams[1] || 'Team B').trim();

    let normStatus = (defaultStatus || 'upcoming').toLowerCase();
    if (normStatus === 'completed' || normStatus === 'finished') {
        normStatus = 'completed';
    } else if (normStatus === 'live') {
        normStatus = 'live';
    } else {
        normStatus = 'upcoming';
    }

    // Gender detection
    const fullText = `${title} ${url} ${teamA} ${teamB}`.toLowerCase();
    let gender = 'men';
    if (fullText.includes('women') || fullText.includes('womens') || fullText.includes(' indw') || fullText.includes(' banw') || fullText.includes('wcpl') || fullText.includes('jew') || fullText.includes('tkrw')) {
        gender = 'women';
    }

    // Format detection
    let format = 'T20';
    if (fullText.includes('odi') || fullText.includes('one-day') || fullText.includes('one day') || fullText.includes('50 over')) {
        format = 'ODI';
    } else if (fullText.includes('test') || fullText.includes('four-day') || fullText.includes('three-day') || fullText.includes('trophy') || fullText.includes('championship')) {
        format = 'Test';
    } else {
        format = 'T20';
    }

    // Live / Upcoming status text
    let matchTimeDisplay = '';
    if (normStatus === 'live') {
        matchTimeDisplay = subStatus ? subStatus : 'Live In Progress';
    } else if (normStatus === 'completed') {
        matchTimeDisplay = subStatus ? subStatus : 'Completed';
    } else {
        matchTimeDisplay = '19:30';
    }

    return {
        teamA,
        teamB,
        venue: venuePart || 'Live Cricket Arena',
        status: normStatus,
        gender,
        format,
        matchTime: matchTimeDisplay,
        subStatus
    };
};

/**
 * @route   GET /api/insights/matches
 * @desc    Get real-time matches with tab filtering (live, upcoming, finished) + Astrological Insights
 * @access  Public (sensitive insight details masked unless purchased)
 */
router.get('/matches', async (req, res) => {
    try {
        const { status } = req.query; // 'live', 'upcoming', 'finished' (completed)
        const currentUser = await getUserFromToken(req);

        let query = {};
        if (status === 'live') {
            query.status = 'live';
        } else if (status === 'upcoming') {
            query.status = 'upcoming';
        } else if (status === 'finished' || status === 'completed') {
            query.status = { $in: ['completed', 'finished'] };
        }

        const dbMatches = await Match.find(query).sort({ matchDate: 1, matchTime: 1 });

        // Get user's purchased match IDs if logged in
        let purchasedMatchIds = new Set();
        let isAdmin = false;

        if (currentUser) {
            if (currentUser.role === 'superadmin') {
                isAdmin = true;
            } else {
                const purchases = await Purchase.find({
                    userId: currentUser.id,
                    status: 'SUCCESS'
                }).select('matchId');
                purchasedMatchIds = new Set(purchases.map(p => p.matchId.toString()));
            }
        }

        // 1. Process MongoDB Matches
        const dbMatchesMap = new Map();
        const formattedDbMatches = dbMatches.map(match => {
            const matchObj = match.toObject();
            const isUnlocked = isAdmin || purchasedMatchIds.has(match._id.toString());
            const hasInsight = !!(matchObj.insightData && matchObj.insightData.isPublished);

            const safeInsight = {
                isPublished: hasInsight,
                price: matchObj.insightData?.price || 49,
                publishedAt: matchObj.insightData?.publishedAt || null,
                isUnlocked: isUnlocked
            };

            if (isUnlocked && hasInsight) {
                safeInsight.astrologicalAdvantage = matchObj.insightData.astrologicalAdvantage;
                safeInsight.keyBatsmen = matchObj.insightData.keyBatsmen || [];
                safeInsight.keyBowlers = matchObj.insightData.keyBowlers || [];
                safeInsight.insightsSummary = matchObj.insightData.insightsSummary || '';
            } else if (hasInsight) {
                safeInsight.previewText = 'Full Astrological Edge & Key Players available. Unlock to view.';
                safeInsight.keyBatsmenCount = (matchObj.insightData.keyBatsmen || []).length;
                safeInsight.keyBowlersCount = (matchObj.insightData.keyBowlers || []).length;
            }

            const parsedDb = parseMatchTitle(`${matchObj.teamA} vs ${matchObj.teamB}, ${matchObj.venue || ''}`, matchObj.status);

            const item = {
                id: matchObj._id.toString(),
                _id: matchObj._id.toString(),
                teamA: matchObj.teamA,
                teamB: matchObj.teamB,
                matchDate: matchObj.matchDate || new Date().toISOString().split('T')[0],
                matchTime: matchObj.matchTime || parsedDb.matchTime,
                venue: matchObj.venue || parsedDb.venue,
                status: matchObj.status,
                gender: matchObj.gender || parsedDb.gender,
                format: matchObj.format || parsedDb.format,
                subStatus: parsedDb.subStatus,
                location: matchObj.location || {},
                result: matchObj.result || {},
                insight: safeInsight,
                isUnlocked: isUnlocked
            };

            const key = `${matchObj.teamA.toLowerCase()}_vs_${matchObj.teamB.toLowerCase()}`;
            dbMatchesMap.set(key, item);
            dbMatchesMap.set(matchObj._id.toString(), item);

            return item;
        });

        // 2. Fetch Real-time Live & Upcoming matches from liveScoreService
        let realTimeMatches = [];
        try {
            const liveResult = await liveScoreService.fetchMatches();
            if (liveResult && Array.isArray(liveResult.matches)) {
                for (const m of liveResult.matches) {
                    const parsed = parseMatchTitle(m.title, m.status, m.url);
                    const key = `${parsed.teamA.toLowerCase()}_vs_${parsed.teamB.toLowerCase()}`;

                    // If match status filter was requested
                    if (status) {
                        const targetStatus = (status === 'finished' ? 'completed' : status).toLowerCase();
                        if (parsed.status !== targetStatus) {
                            continue;
                        }
                    }

                    // If this match already has DB insights / was saved
                    if (dbMatchesMap.has(key) || dbMatchesMap.has(m.match_id)) {
                        continue; // Already included from DB
                    }

                    const isUnlocked = isAdmin || purchasedMatchIds.has(m.match_id);

                    realTimeMatches.push({
                        id: m.match_id,
                        _id: m.match_id,
                        teamA: parsed.teamA,
                        teamB: parsed.teamB,
                        matchDate: new Date().toISOString().split('T')[0],
                        matchTime: parsed.matchTime,
                        venue: parsed.venue,
                        status: parsed.status,
                        gender: parsed.gender,
                        format: parsed.format,
                        subStatus: parsed.subStatus,
                        url: m.url,
                        insight: {
                            isPublished: false,
                            price: 49,
                            publishedAt: null,
                            isUnlocked: isUnlocked,
                            previewText: 'Awaiting Astrological Calculation'
                        },
                        isUnlocked: isUnlocked
                    });
                }
            }
        } catch (liveErr) {
            console.warn('Realtime live matches warning:', liveErr.message);
        }

        // Combine DB matches and real-time live matches
        const allMatches = [...formattedDbMatches, ...realTimeMatches];

        res.json({
            success: true,
            count: allMatches.length,
            matches: allMatches
        });
    } catch (err) {
        console.error('Error fetching matches with insights:', err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

/**
 * @route   GET /api/insights/match/:id
 * @desc    Get detailed match analysis (checks purchase status)
 * @access  Public/Auth
 */
router.get('/match/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = await getUserFromToken(req);
        let match = null;

        // 1. Try finding by MongoDB ID
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            match = await Match.findById(id);
        }

        let matchObj;
        let isUnlocked = false;

        if (match) {
            matchObj = match.toObject();
            if (currentUser) {
                if (currentUser.role === 'superadmin') {
                    isUnlocked = true;
                } else {
                    const purchase = await Purchase.findOne({
                        userId: currentUser.id,
                        matchId: match._id,
                        status: 'SUCCESS'
                    });
                    if (purchase) isUnlocked = true;
                }
            }
        } else {
            // Check real-time matches
            let foundRealTime = null;
            try {
                const liveResult = await liveScoreService.fetchMatches();
                if (liveResult && Array.isArray(liveResult.matches)) {
                    foundRealTime = liveResult.matches.find(m => m.match_id === id);
                }
            } catch (e) {}

            if (foundRealTime) {
                const parsed = parseMatchTitle(foundRealTime.title, foundRealTime.status);
                matchObj = {
                    _id: foundRealTime.match_id,
                    id: foundRealTime.match_id,
                    teamA: parsed.teamA,
                    teamB: parsed.teamB,
                    matchDate: new Date().toISOString().split('T')[0],
                    matchTime: '19:30',
                    venue: parsed.venue,
                    status: parsed.status,
                    url: foundRealTime.url,
                    insightData: {
                        isPublished: false,
                        price: 49
                    }
                };
            } else {
                return res.status(404).json({ success: false, msg: 'Match not found' });
            }
        }

        const hasInsight = !!(matchObj.insightData && matchObj.insightData.isPublished);

        const safeInsight = {
            isPublished: hasInsight,
            price: matchObj.insightData?.price || 49,
            publishedAt: matchObj.insightData?.publishedAt || null,
            isUnlocked: isUnlocked
        };

        if (isUnlocked && hasInsight) {
            safeInsight.astrologicalAdvantage = matchObj.insightData.astrologicalAdvantage;
            safeInsight.keyBatsmen = matchObj.insightData.keyBatsmen || [];
            safeInsight.keyBowlers = matchObj.insightData.keyBowlers || [];
            safeInsight.insightsSummary = matchObj.insightData.insightsSummary || '';
        }

        res.json({
            success: true,
            match: {
                id: matchObj._id.toString(),
                _id: matchObj._id.toString(),
                teamA: matchObj.teamA,
                teamB: matchObj.teamB,
                matchDate: matchObj.matchDate,
                matchTime: matchObj.matchTime,
                venue: matchObj.venue || '',
                location: matchObj.location || {},
                status: matchObj.status,
                result: matchObj.result || {},
                insight: safeInsight,
                isUnlocked: isUnlocked
            }
        });
    } catch (err) {
        console.error('Error fetching match detail:', err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

/**
 * @route   POST /api/insights/publish/:id
 * @desc    Publish/Post Match Insights from Admin Panel & trigger Push Notifications
 * @access  Private (Admin Only)
 */
router.post('/publish/:id', adminAuth, async (req, res) => {
    try {
        const {
            astrologicalAdvantage,
            keyBatsmen,
            keyBowlers,
            insightsSummary,
            price = 49,
            notifyUsers = true
        } = req.body;

        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ success: false, msg: 'Match not found' });

        const publishedAt = new Date();

        match.insightData = {
            astrologicalAdvantage,
            keyBatsmen: Array.isArray(keyBatsmen) ? keyBatsmen : [],
            keyBowlers: Array.isArray(keyBowlers) ? keyBowlers : [],
            insightsSummary: insightsSummary || '',
            price: Number(price) || 49,
            isPublished: true,
            publishedAt: publishedAt,
            notifiedAt: notifyUsers ? publishedAt : null
        };

        // Sync legacy expertPrediction field as well
        const allKeyPlayerNames = [
            ...(keyBatsmen || []).map(p => typeof p === 'string' ? p : p.name),
            ...(keyBowlers || []).map(p => typeof p === 'string' ? p : p.name)
        ].filter(Boolean);

        match.expertPrediction = {
            predictedWinner: astrologicalAdvantage || '',
            keyPlayers: allKeyPlayerNames,
            reasoning: insightsSummary || '',
            isPublished: true,
            publishedAt: publishedAt
        };

        await match.save();

        // Dispatch FCM Push Notification
        if (notifyUsers) {
            fcmService.sendMatchInsightNotification({
                matchId: match._id,
                teamA: match.teamA,
                teamB: match.teamB,
                advantage: astrologicalAdvantage,
                summary: insightsSummary
            }).catch(e => console.error('Background FCM error:', e));
        }

        res.json({
            success: true,
            msg: 'Match Insights successfully posted to Mobile App',
            match
        });
    } catch (err) {
        console.error('Error publishing match insight:', err);
        res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
    }
});

/**
 * @route   POST /api/insights/payment/initiate
 * @desc    Initiate PhonePe payment for match insight unlock
 * @access  Private
 */
router.post('/payment/initiate', requireAuth, async (req, res) => {
    try {
        const { matchId, mobileNumber } = req.body;
        if (!matchId) return res.status(400).json({ success: false, msg: 'matchId is required' });

        const match = await Match.findById(matchId);
        if (!match) return res.status(404).json({ success: false, msg: 'Match not found' });

        // Check if already purchased
        const existingPurchase = await Purchase.findOne({
            userId: req.user.id,
            matchId: match._id,
            status: 'SUCCESS'
        });

        if (existingPurchase) {
            return res.json({
                success: true,
                alreadyPurchased: true,
                msg: 'You have already unlocked this match insight'
            });
        }

        const amount = match.insightData?.price || 49;
        const merchantTransactionId = `ASTRO_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        const newPurchase = new Purchase({
            userId: req.user.id,
            userEmail: req.user.email || req.user.username,
            matchId: match._id,
            merchantTransactionId: merchantTransactionId,
            amount: amount,
            currency: 'INR',
            status: 'PENDING'
        });

        await newPurchase.save();

        const host = req.get('host');
        const protocol = req.protocol;
        const baseUrl = `${protocol}://${host}`;

        const redirectUrl = `${baseUrl}/api/insights/payment/return-url?transactionId=${merchantTransactionId}`;
        const callbackUrl = `${baseUrl}/api/insights/payment/callback`;

        const paymentInitResult = await phonepeService.initiatePayment({
            merchantTransactionId,
            merchantUserId: String(req.user.id),
            amount,
            redirectUrl,
            callbackUrl,
            mobileNumber: mobileNumber || '9999999999'
        });

        if (paymentInitResult.success) {
            const redirectInfo = paymentInitResult.data?.data?.instrumentResponse?.redirectInfo;
            res.json({
                success: true,
                merchantTransactionId,
                paymentUrl: redirectInfo?.url,
                data: paymentInitResult.data
            });
        } else {
            res.status(500).json({
                success: false,
                msg: 'Could not initiate PhonePe payment',
                error: paymentInitResult.error
            });
        }
    } catch (err) {
        console.error('Error initiating PhonePe payment:', err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

/**
 * @route   POST /api/insights/payment/callback
 * @desc    PhonePe Server-to-Server Webhook callback
 * @access  Public (PhonePe Server)
 */
router.post('/payment/callback', async (req, res) => {
    try {
        const { response } = req.body;
        const xVerify = req.header('X-VERIFY');

        if (!response) {
            return res.status(400).json({ success: false, msg: 'Missing response payload' });
        }

        const isValidChecksum = phonepeService.verifyCallbackChecksum(response, xVerify);
        if (!isValidChecksum) {
            console.warn('[PhonePe Webhook] Checksum mismatch');
        }

        const decodedBuffer = Buffer.from(response, 'base64');
        const decodedData = JSON.parse(decodedBuffer.toString('utf8'));

        const merchantTransactionId = decodedData.data?.merchantTransactionId;
        const transactionId = decodedData.data?.transactionId;
        const responseCode = decodedData.code;

        if (merchantTransactionId) {
            const purchase = await Purchase.findOne({ merchantTransactionId });
            if (purchase) {
                purchase.rawResponse = decodedData;
                purchase.phonepeTransactionId = transactionId;
                purchase.updatedAt = new Date();

                if (responseCode === 'PAYMENT_SUCCESS') {
                    purchase.status = 'SUCCESS';
                } else if (responseCode === 'PAYMENT_ERROR' || responseCode === 'PAYMENT_DECLINED') {
                    purchase.status = 'FAILED';
                }
                await purchase.save();
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('PhonePe Callback Error:', err);
        res.status(500).json({ success: false });
    }
});

/**
 * @route   POST /api/insights/payment/verify
 * @desc    Verify transaction status manually or on app return
 * @access  Private
 */
router.post('/payment/verify', requireAuth, async (req, res) => {
    try {
        const { merchantTransactionId } = req.body;
        if (!merchantTransactionId) {
            return res.status(400).json({ success: false, msg: 'merchantTransactionId required' });
        }

        let purchase = await Purchase.findOne({
            merchantTransactionId,
            userId: req.user.id
        });

        if (!purchase) {
            return res.status(404).json({ success: false, msg: 'Transaction not found' });
        }

        if (purchase.status !== 'SUCCESS') {
            const statusResult = await phonepeService.checkTransactionStatus(merchantTransactionId);
            if (statusResult && (statusResult.code === 'PAYMENT_SUCCESS' || statusResult.data?.state === 'COMPLETED')) {
                purchase.status = 'SUCCESS';
                purchase.phonepeTransactionId = statusResult.data?.transactionId || purchase.phonepeTransactionId;
                purchase.rawResponse = statusResult;
                purchase.updatedAt = new Date();
                await purchase.save();
            }
        }

        res.json({
            success: true,
            status: purchase.status,
            isUnlocked: purchase.status === 'SUCCESS',
            matchId: purchase.matchId
        });
    } catch (err) {
        console.error('Error verifying payment:', err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

/**
 * @route   GET /api/insights/my-purchases
 * @desc    Get all unlocked insights for the user
 * @access  Private
 */
router.get('/my-purchases', requireAuth, async (req, res) => {
    try {
        const purchases = await Purchase.find({
            userId: req.user.id,
            status: 'SUCCESS'
        }).populate('matchId').sort({ createdAt: -1 });

        res.json({
            success: true,
            purchases: purchases.map(p => ({
                purchaseId: p._id,
                match: p.matchId,
                amount: p.amount,
                purchasedAt: p.createdAt
            }))
        });
    } catch (err) {
        console.error('Error fetching purchases:', err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

module.exports = router;
