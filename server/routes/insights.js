const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Match = require('../models/Match');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');
const phonepeService = require('../utils/phonepeService');
const razorpayService = require('../utils/razorpayService');
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
const { parseMatchTitle, syncCricbuzzMatchesToDB } = require('../utils/matchScraperService');

/**
 * @route   GET /api/insights/matches
 * @desc    Get real-time matches with tab filtering (live, upcoming, finished) + Astrological Insights
 *          Mobile App / Client users read 100% from MongoDB (zero Cricbuzz scraping / zero server load).
 *          Admin syncs automatically upsert Cricbuzz matches into MongoDB.
 * @access  Public (sensitive insight details masked unless purchased)
 */
router.get('/matches', async (req, res) => {
    try {
        const { status } = req.query; // 'live', 'upcoming', 'finished' (completed)
        const currentUser = await getUserFromToken(req);
        const isAdmin = currentUser?.role === 'superadmin';

        // 1. If Admin requested a sync (Admin panel access or "Sync Live Matches" button)
        if (isAdmin && (req.query.source === 'admin' || req.query.sync === 'true')) {
            await syncCricbuzzMatchesToDB(req.query.force === 'true');
        }

        // 2. Query strictly from MongoDB for ALL users (mobile app & web clients)
        let query = {};
        if (status === 'live') {
            query.status = 'live';
        } else if (status === 'upcoming') {
            query.status = 'upcoming';
        } else if (status === 'finished' || status === 'completed') {
            query.status = { $in: ['completed', 'finished'] };
        }

        // Sort by predicted matches first ('insightData.isPublished': -1), then chronological
        const dbMatches = await Match.find(query).sort({ 'insightData.isPublished': -1, matchDate: 1, matchTime: 1 });

        // Get user's purchased match IDs and pass balance if logged in
        let purchasedMatchIds = new Set();
        let userFreePasses = 0;
        if (currentUser && !isAdmin) {
            const [purchases, userDoc] = await Promise.all([
                Purchase.find({
                    userId: currentUser.id,
                    status: 'SUCCESS'
                }).select('matchId'),
                User.findById(currentUser.id).select('freePasses')
            ]);
            purchasedMatchIds = new Set(purchases.map(p => p.matchId.toString()));
            userFreePasses = userDoc?.freePasses || 0;
        }

        // 3. Format MongoDB Matches safely
        const formattedMatches = dbMatches.map(match => {
            const matchObj = match.toObject();
            const matchPrice = matchObj.insightData?.price !== undefined ? matchObj.insightData.price : 49;
            const isUnlocked = isAdmin || (matchPrice === 0) || purchasedMatchIds.has(match._id.toString());
            const hasInsight = !!(matchObj.insightData && matchObj.insightData.isPublished);

            const safeInsight = {
                isPublished: hasInsight,
                price: matchPrice,
                publishedAt: matchObj.insightData?.publishedAt || null,
                isUnlocked: isUnlocked
            };

            if (isUnlocked && hasInsight) {
                safeInsight.astrologicalAdvantage = matchObj.insightData.astrologicalAdvantage;
                safeInsight.keyBatsmen = matchObj.insightData.keyBatsmen || [];
                safeInsight.keyBowlers = matchObj.insightData.keyBowlers || [];
                safeInsight.insightsSummary = matchObj.insightData.insightsSummary || '';
                const rawUpdates = matchObj.insightData.timelineUpdates || [];
                safeInsight.timelineUpdates = rawUpdates.slice().sort((a, b) => {
                    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                    return timeB - timeA;
                });
            } else if (hasInsight) {
                safeInsight.previewText = 'Full Planetary Influences & Key Impact Players available. Unlock to view.';
                safeInsight.keyBatsmenCount = (matchObj.insightData.keyBatsmen || []).length;
                safeInsight.keyBowlersCount = (matchObj.insightData.keyBowlers || []).length;
            }

            return {
                id: matchObj._id.toString(),
                _id: matchObj._id.toString(),
                matchTitle: `${matchObj.teamA} vs ${matchObj.teamB}`,
                matchTimeDisplay: matchObj.matchTime || '',
                teamA: matchObj.teamA,
                teamB: matchObj.teamB,
                matchDate: matchObj.matchDate || new Date().toISOString().split('T')[0],
                matchTime: matchObj.matchTime || '',
                venue: matchObj.venue || 'Cricket Arena',
                status: matchObj.status,
                gender: matchObj.gender || 'men',
                format: matchObj.format || 'T20',
                subStatus: matchObj.subStatus,
                location: matchObj.location || {},
                result: matchObj.result || {},
                predictionResult: matchObj.predictionResult || 'PENDING',
                predictionResultNote: matchObj.predictionResultNote || '',
                compensatedCount: matchObj.compensatedCount || 0,
                compensatedAt: matchObj.compensatedAt || null,
                insight: safeInsight,
                isUnlocked: isUnlocked
            };
        });

        res.json({
            success: true,
            count: formattedMatches.length,
            freePasses: userFreePasses,
            matches: formattedMatches
        });
    } catch (err) {
        console.error('Error fetching matches with insights:', err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

/**
 * @route   POST /api/insights/admin/sync-matches
 * @desc    Dedicated Admin Sync Endpoint to trigger Cricbuzz scrape & MongoDB upsert
 * @access  Private (Admin Only)
 */
router.post('/admin/sync-matches', adminAuth, async (req, res) => {
    try {
        const result = await syncCricbuzzMatchesToDB(true);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
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
                    matchDate: foundRealTime.matchDate || new Date().toISOString().split('T')[0],
                    matchTime: foundRealTime.matchTime || parsed.matchTime || '',
                    venue: foundRealTime.venue || parsed.venue,
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
        const matchPrice = matchObj.insightData?.price !== undefined ? matchObj.insightData.price : 49;

        const safeInsight = {
            isPublished: hasInsight,
            price: matchPrice,
            publishedAt: matchObj.insightData?.publishedAt || null,
            isUnlocked: isUnlocked
        };

        if (isUnlocked && hasInsight) {
            safeInsight.astrologicalAdvantage = matchObj.insightData.astrologicalAdvantage;
            safeInsight.keyBatsmen = matchObj.insightData.keyBatsmen || [];
            safeInsight.keyBowlers = matchObj.insightData.keyBowlers || [];
            safeInsight.insightsSummary = matchObj.insightData.insightsSummary || '';
            const rawUpdates = matchObj.insightData.timelineUpdates || [];
            safeInsight.timelineUpdates = rawUpdates.slice().sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
            });
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
                status: matchObj.status,
                gender: matchObj.gender,
                format: matchObj.format,
                insight: safeInsight,
                isUnlocked: isUnlocked
            }
        });
    } catch (err) {
        console.error('Error fetching match details:', err);
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
            teamA,
            teamB,
            matchDate,
            matchTime,
            venue,
            status: matchStatus,
            gender,
            format,
            astrologicalAdvantage,
            keyBatsmen,
            keyBowlers,
            insightsSummary,
            timelineUpdates,
            price,
            notifyUsers = true
        } = req.body;

        let match = null;

        // 1. Try finding by MongoDB ObjectId if valid
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            match = await Match.findById(req.params.id);
        }

        // 2. If not found by ID, try matching by team names
        if (!match && teamA && teamB) {
            const escapeRegex = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            match = await Match.findOne({
                teamA: { $regex: new RegExp(`^${escapeRegex(teamA.trim())}$`, 'i') },
                teamB: { $regex: new RegExp(`^${escapeRegex(teamB.trim())}$`, 'i') }
            });
        }

        // 3. If still not in DB, create new Match document
        if (!match) {
            match = new Match({
                teamA: teamA || 'Team A',
                teamB: teamB || 'Team B',
                matchDate: matchDate || new Date().toISOString().split('T')[0],
                matchTime: matchTime || '',
                venue: venue || 'Cricket Arena',
                status: matchStatus || 'upcoming'
            });
        } else {
            // Also update match details if provided by Admin
            if (matchDate) match.matchDate = matchDate;
            if (matchTime) match.matchTime = matchTime;
            if (venue) match.venue = venue;
            if (matchStatus) match.status = matchStatus;
        }

        const publishedAt = new Date();
        const safePrice = (price !== undefined && price !== null && price !== '') ? Math.max(0, Number(price)) : 49;

        // Normalize timeline updates with timestamps
        let normalizedTimeline = [];
        if (Array.isArray(timelineUpdates) && timelineUpdates.length > 0) {
            normalizedTimeline = timelineUpdates
                .filter(u => u && (typeof u.text === 'string' ? u.text.trim() : (u.message ? u.message.trim() : false)))
                .map(u => ({
                    id: u.id || `tip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    time: u.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    timestamp: u.timestamp ? new Date(u.timestamp) : new Date(),
                    text: (u.text || u.message || '').trim(),
                    title: (u.title || '').trim()
                }));
        } else if (insightsSummary && typeof insightsSummary === 'string' && insightsSummary.trim()) {
            normalizedTimeline = [{
                id: `tip_${Date.now()}`,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                timestamp: new Date(),
                text: insightsSummary.trim(),
                title: 'Match Analysis'
            }];
        }

        // Determine effective summary text for legacy clients and notifications
        const effectiveSummary = (insightsSummary && typeof insightsSummary === 'string' && insightsSummary.trim())
            ? insightsSummary.trim()
            : (normalizedTimeline.length > 0 ? normalizedTimeline[0].text : '');

        match.insightData = {
            astrologicalAdvantage,
            keyBatsmen: Array.isArray(keyBatsmen) ? keyBatsmen : [],
            keyBowlers: Array.isArray(keyBowlers) ? keyBowlers : [],
            insightsSummary: effectiveSummary,
            timelineUpdates: normalizedTimeline,
            price: safePrice,
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
            reasoning: effectiveSummary,
            isPublished: true,
            publishedAt: publishedAt
        };

        await match.save();

        // Dispatch FCM Push Notification (EXACT SAME FCM SERVICE CALL - 100% UNTOUCHED)
        if (notifyUsers) {
            fcmService.sendMatchInsightNotification({
                matchId: match._id,
                teamA: match.teamA,
                teamB: match.teamB,
                advantage: astrologicalAdvantage,
                summary: effectiveSummary
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
 * @route   POST /api/insights/purchase/record-completed
 * @desc    Record completed payment made via sbastro.com in-app browser
 * @access  Private / Auth optional
 */
router.post('/purchase/record-completed', async (req, res) => {
    try {
        const { matchId, orderId, amount, userId } = req.body;
        const currentUser = await getUserFromToken(req);
        const resolvedUserId = currentUser ? currentUser.id : (userId || 'guest_user');

        if (!matchId) {
            return res.status(400).json({ success: false, msg: 'matchId is required' });
        }

        let purchase = await Purchase.findOne({
            userId: resolvedUserId,
            matchId: matchId,
            status: 'SUCCESS'
        });

        if (!purchase) {
            purchase = new Purchase({
                userId: resolvedUserId,
                userEmail: currentUser ? (currentUser.email || currentUser.username) : 'mobile_user@sbastro.com',
                matchId: matchId,
                merchantTransactionId: orderId || `SBA_${Date.now()}`,
                amount: amount || 49,
                currency: 'INR',
                status: 'SUCCESS'
            });
            await purchase.save();
        }

        res.json({
            success: true,
            isUnlocked: true,
            matchId: matchId,
            msg: 'Purchase successfully recorded'
        });
    } catch (err) {
        console.error('Error recording completed purchase:', err);
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

/**
 * @route   GET /api/insights/fcm-status
 * @desc    Check Firebase Admin SDK initialization status
 * @access  Public
 */
router.get('/fcm-status', (req, res) => {
    const { getApps } = require('firebase-admin/app');
    const isReady = getApps().length > 0;
    res.json({
        success: true,
        fcmInitialized: isReady,
        hasEnvJson: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        hasEnvBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        message: isReady
            ? 'Firebase Admin SDK is active and ready to broadcast push notifications.'
            : 'Firebase Admin SDK is NOT initialized. Please set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_JSON in Railway environment variables.'
    });
});

/**
 * @route   POST /api/insights/test-notification
 * @desc    Send a test broadcast notification to all app users
 * @access  Admin
 */
router.post('/test-notification', adminAuth, async (req, res) => {
    try {
        const { title = '🏏 AstroCricket Test Notification', body = 'Push notifications are working perfectly!' } = req.body;
        const result = await fcmService.sendMatchInsightNotification({
            matchId: 'test_alert',
            teamA: 'Team Alpha',
            teamB: 'Team Beta',
            advantage: 'Live Test Alert',
            summary: body
        });
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @route   GET /api/insights/user-passes
 * @desc    Get user's available Free Prediction Passes
 * @access  Private
 */
router.get('/user-passes', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('freePasses username email');
        res.json({
            success: true,
            freePasses: user?.freePasses || 0
        });
    } catch (err) {
        console.error('Error fetching user passes:', err);
        res.status(500).json({ success: false, msg: 'Server error fetching user passes' });
    }
});

/**
 * @route   POST /api/insights/purchase/razorpay/create-order
 * @desc    Create Razorpay Order for Match Insight Prediction
 * @access  Private
 */
router.post('/purchase/razorpay/create-order', requireAuth, async (req, res) => {
    try {
        const { matchId } = req.body;
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

        const amount = match.insightData?.price !== undefined ? match.insightData.price : 49;
        const merchantTransactionId = `RZP_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        const orderResult = await razorpayService.createOrder(amount, merchantTransactionId, {
            matchId: String(match._id),
            userId: String(req.user.id),
            matchTitle: `${match.teamA} vs ${match.teamB}`
        });

        if (!orderResult.success) {
            return res.status(500).json({
                success: false,
                msg: 'Could not create Razorpay order',
                error: orderResult.error
            });
        }

        // Store pending purchase
        const newPurchase = new Purchase({
            userId: req.user.id,
            userEmail: req.user.email || req.user.username,
            matchId: match._id,
            merchantTransactionId: merchantTransactionId,
            razorpayOrderId: orderResult.orderId,
            amount: amount,
            currency: 'INR',
            status: 'PENDING',
            paymentMethod: 'RAZORPAY'
        });
        await newPurchase.save();

        res.json({
            success: true,
            orderId: orderResult.orderId,
            amount: orderResult.amount, // in paise
            amountInINR: amount,
            currency: orderResult.currency,
            keyId: orderResult.keyId,
            merchantTransactionId,
            matchTitle: `${match.teamA} vs ${match.teamB}`
        });
    } catch (err) {
        console.error('Error creating Razorpay order:', err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

/**
 * @route   POST /api/insights/purchase/razorpay/verify
 * @desc    Verify Razorpay payment and unlock match
 * @access  Private
 */
router.post('/purchase/razorpay/verify', requireAuth, async (req, res) => {
    try {
        const { matchId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId) {
            return res.status(400).json({ success: false, msg: 'Razorpay orderId and paymentId are required' });
        }

        // Verify HMAC signature if signature provided and real key configured
        let isValid = true;
        if (razorpaySignature && process.env.RAZORPAY_KEY_SECRET) {
            isValid = razorpayService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        }

        if (!isValid) {
            return res.status(400).json({ success: false, msg: 'Invalid Razorpay payment signature' });
        }

        let purchase = await Purchase.findOne({
            userId: req.user.id,
            $or: [
                { razorpayOrderId: razorpayOrderId },
                { matchId: matchId, status: 'PENDING' }
            ]
        });

        if (!purchase) {
            purchase = new Purchase({
                userId: req.user.id,
                userEmail: req.user.email || req.user.username,
                matchId: matchId,
                merchantTransactionId: razorpayOrderId,
                razorpayOrderId: razorpayOrderId,
                amount: 49,
                currency: 'INR',
                status: 'SUCCESS',
                paymentMethod: 'RAZORPAY'
            });
        }

        purchase.razorpayOrderId = razorpayOrderId;
        purchase.razorpayPaymentId = razorpayPaymentId;
        purchase.razorpaySignature = razorpaySignature || '';
        purchase.status = 'SUCCESS';
        purchase.paymentMethod = 'RAZORPAY';
        purchase.updatedAt = new Date();
        await purchase.save();

        res.json({
            success: true,
            isUnlocked: true,
            matchId: purchase.matchId,
            msg: 'Payment verified and match prediction unlocked successfully!'
        });
    } catch (err) {
        console.error('Error verifying Razorpay payment:', err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

/**
 * @route   POST /api/insights/purchase/razorpay/webhook
 * @desc    Razorpay Webhook listener to automatically confirm payments and unlock insights
 * @access  Public (Signature-verified)
 */
router.post('/purchase/razorpay/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const rawBody = req.rawBody || JSON.stringify(req.body);

        // Verify webhook signature if configured
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
        if (webhookSecret && signature) {
            const isValid = razorpayService.verifyWebhookSignature(rawBody, signature, webhookSecret);
            if (!isValid) {
                console.warn('[Razorpay Webhook] Invalid webhook signature received');
                return res.status(400).json({ success: false, msg: 'Invalid webhook signature' });
            }
        }

        const event = req.body.event;
        const payload = req.body.payload || {};
        console.log(`[Razorpay Webhook] Event received: ${event}`);

        // Handle payment captured or order paid
        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentEntity = payload.payment?.entity;
            const orderEntity = payload.order?.entity;

            const orderId = paymentEntity?.order_id || orderEntity?.id;
            const paymentId = paymentEntity?.id;
            const notes = paymentEntity?.notes || orderEntity?.notes || {};
            const matchId = notes.matchId;
            const userId = notes.userId;
            const amountInPaise = paymentEntity?.amount || orderEntity?.amount || 0;
            const amountInINR = amountInPaise > 0 ? amountInPaise / 100 : 49;
            const userEmail = paymentEntity?.email || '';

            if (orderId || matchId) {
                // Find existing purchase or create one
                let purchase = null;
                if (orderId) {
                    purchase = await Purchase.findOne({ razorpayOrderId: orderId });
                }
                if (!purchase && userId && matchId) {
                    purchase = await Purchase.findOne({ userId, matchId, status: 'PENDING' });
                }

                if (purchase) {
                    purchase.status = 'SUCCESS';
                    if (paymentId) purchase.razorpayPaymentId = paymentId;
                    if (orderId) purchase.razorpayOrderId = orderId;
                    purchase.paymentMethod = 'RAZORPAY';
                    purchase.updatedAt = new Date();
                    await purchase.save();
                    console.log(`[Razorpay Webhook] Purchase updated to SUCCESS for Order: ${orderId}, Match: ${purchase.matchId}`);
                } else if (userId && matchId) {
                    // Create new confirmed purchase
                    purchase = new Purchase({
                        userId: userId,
                        userEmail: userEmail,
                        matchId: matchId,
                        merchantTransactionId: orderId || `RZP_WH_${Date.now()}`,
                        razorpayOrderId: orderId,
                        razorpayPaymentId: paymentId,
                        amount: amountInINR,
                        currency: 'INR',
                        status: 'SUCCESS',
                        paymentMethod: 'RAZORPAY'
                    });
                    await purchase.save();
                    console.log(`[Razorpay Webhook] New purchase created as SUCCESS for Order: ${orderId}, Match: ${matchId}`);
                }
            }
        } else if (event === 'payment.failed') {
            const paymentEntity = payload.payment?.entity;
            const orderId = paymentEntity?.order_id;
            if (orderId) {
                const purchase = await Purchase.findOne({ razorpayOrderId: orderId });
                if (purchase && purchase.status === 'PENDING') {
                    purchase.status = 'FAILED';
                    purchase.updatedAt = new Date();
                    await purchase.save();
                    console.log(`[Razorpay Webhook] Purchase marked FAILED for Order: ${orderId}`);
                }
            }
        }

        // Always acknowledge Razorpay webhooks quickly with 200 OK
        res.status(200).json({ status: 'ok', received: true });
    } catch (err) {
        console.error('[Razorpay Webhook] Processing error:', err);
        // Return 200 so Razorpay does not retry broken payload infinitely
        res.status(200).json({ status: 'error', message: err.message });
    }
});

/**
 * @route   POST /api/insights/purchase/unlock-with-pass
 * @desc    Unlock match insight prediction using 1 Free Replacement Pass
 * @access  Private
 */
router.post('/purchase/unlock-with-pass', requireAuth, async (req, res) => {
    try {
        const { matchId } = req.body;
        if (!matchId) return res.status(400).json({ success: false, msg: 'matchId is required' });

        const user = await User.findById(req.user.id);
        if (!user || (user.freePasses || 0) < 1) {
            return res.status(400).json({
                success: false,
                msg: 'You do not have any Free Passes available. Please purchase with Razorpay.'
            });
        }

        const match = await Match.findById(matchId);
        if (!match) return res.status(404).json({ success: false, msg: 'Match not found' });

        // Check if already unlocked
        const existingPurchase = await Purchase.findOne({
            userId: req.user.id,
            matchId: match._id,
            status: 'SUCCESS'
        });

        if (existingPurchase) {
            return res.json({
                success: true,
                alreadyPurchased: true,
                remainingPasses: user.freePasses,
                msg: 'This match prediction is already unlocked!'
            });
        }

        // Deduct 1 pass
        user.freePasses = Math.max(0, (user.freePasses || 1) - 1);
        await user.save();

        // Create unlocked purchase record
        const passPurchase = new Purchase({
            userId: user._id,
            userEmail: user.email || user.username,
            matchId: match._id,
            merchantTransactionId: `PASS_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            amount: 0,
            currency: 'INR',
            status: 'SUCCESS',
            paymentMethod: 'FREE_PASS'
        });
        await passPurchase.save();

        res.json({
            success: true,
            isUnlocked: true,
            remainingPasses: user.freePasses,
            msg: 'Match prediction unlocked for FREE using 1 Replacement Pass!'
        });
    } catch (err) {
        console.error('Error unlocking with pass:', err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

/**
 * @route   POST /api/insights/match/:matchId/resolve-prediction
 * @desc    Admin resolves match prediction outcome: 'WON', 'LOST', or 'VOID'
 *          If 'LOST' or 'VOID': Automatically awards 1 Free Pass to all users who purchased!
 * @access  Admin Only
 */
router.post('/match/:matchId/resolve-prediction', adminAuth, async (req, res) => {
    try {
        const { matchId } = req.params;
        const { result, note } = req.body; // 'WON', 'LOST', 'VOID'

        if (!['WON', 'LOST', 'VOID'].includes(result)) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid result. Must be "WON", "LOST", or "VOID"'
            });
        }

        const match = await Match.findById(matchId);
        if (!match) return res.status(404).json({ success: false, msg: 'Match not found' });

        match.predictionResult = result;
        if (note) match.predictionResultNote = note;

        let compensatedCount = 0;

        // Auto-compensation when prediction fails or match is cancelled
        if (result === 'LOST' || result === 'VOID') {
            // Find all successful purchases for this match not yet compensated
            const eligiblePurchases = await Purchase.find({
                matchId: match._id,
                status: 'SUCCESS',
                isCompensated: { $ne: true }
            });

            const uniqueUserIds = [...new Set(eligiblePurchases.map(p => String(p.userId)))];

            for (const uid of uniqueUserIds) {
                try {
                    if (mongoose.Types.ObjectId.isValid(uid)) {
                        await User.findByIdAndUpdate(uid, { $inc: { freePasses: 1 } });
                    } else {
                        await User.findOneAndUpdate(
                            { $or: [{ _id: uid }, { username: uid }, { googleId: uid }] },
                            { $inc: { freePasses: 1 } }
                        );
                    }
                    compensatedCount++;
                } catch (userErr) {
                    console.warn(`Could not credit pass to user ${uid}:`, userErr.message);
                }
            }

            // Mark purchases as compensated
            await Purchase.updateMany(
                { matchId: match._id, status: 'SUCCESS', isCompensated: { $ne: true } },
                { $set: { isCompensated: true } }
            );

            match.compensatedCount = (match.compensatedCount || 0) + compensatedCount;
            match.compensatedAt = new Date();

            // Broadcast FCM notification about free replacement pass
            try {
                await fcmService.sendMatchInsightNotification({
                    matchId: String(match._id),
                    teamA: match.teamA,
                    teamB: match.teamB,
                    advantage: 'Free Pass Credited 🎁',
                    summary: `${match.teamA} vs ${match.teamB} prediction result: ${result}. A 100% Free Replacement Pass has been credited to your account for your next match!`
                });
            } catch (notifyErr) {
                console.warn('FCM broadcast notification error:', notifyErr.message);
            }
        }

        await match.save();

        res.json({
            success: true,
            predictionResult: match.predictionResult,
            compensatedCount,
            msg: (result === 'LOST' || result === 'VOID')
                ? `Prediction marked as ${result}! 1 Free Replacement Pass credited to ${compensatedCount} user(s).`
                : `Prediction marked as ${result}! Great win.`
        });
    } catch (err) {
        console.error('Error resolving prediction:', err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

module.exports = router;

