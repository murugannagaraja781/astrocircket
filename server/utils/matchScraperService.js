const liveScoreService = require('./liveScoreService');
const Match = require('../models/Match');

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
        matchTimeDisplay = '';
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
 * Scrapes real-time matches from Cricbuzz into MongoDB.
 * Preserves all admin published insights ($setOnInsert).
 */
const syncCricbuzzMatchesToDB = async (forceRefresh = false) => {
    try {
        const liveResult = await liveScoreService.fetchMatches(forceRefresh);
        if (!liveResult || !Array.isArray(liveResult.matches) || liveResult.matches.length === 0) {
            return { success: false, msg: 'No matches found from Cricbuzz' };
        }

        const ops = liveResult.matches.map(m => {
            const parsed = parseMatchTitle(m.title, m.status, m.url);
            const matchDate = m.matchDate || new Date().toISOString().split('T')[0];
            const matchTime = m.matchTime || '';
            const venue = m.venue || parsed.venue;

            return {
                updateOne: {
                    filter: {
                        $or: [
                            { cricbuzzMatchId: m.match_id },
                            {
                                teamA: { $regex: new RegExp(`^${parsed.teamA.trim()}$`, 'i') },
                                teamB: { $regex: new RegExp(`^${parsed.teamB.trim()}$`, 'i') }
                            }
                        ]
                    },
                    update: {
                        $set: {
                            teamA: parsed.teamA,
                            teamB: parsed.teamB,
                            matchDate,
                            matchTime,
                            venue,
                            status: parsed.status,
                            gender: parsed.gender,
                            format: parsed.format,
                            subStatus: parsed.subStatus,
                            cricbuzzMatchId: m.match_id
                        },
                        $setOnInsert: {
                            insightData: {
                                isPublished: false,
                                price: 49,
                                astrologicalAdvantage: '',
                                keyBatsmen: [],
                                keyBowlers: [],
                                insightsSummary: ''
                            },
                            createdAt: new Date()
                        }
                    },
                    upsert: true
                }
            };
        });

        const bulkRes = await Match.bulkWrite(ops);
        return {
            success: true,
            totalScraped: liveResult.matches.length,
            upserted: bulkRes.upsertedCount,
            modified: bulkRes.modifiedCount,
            matched: bulkRes.matchedCount
        };
    } catch (err) {
        console.error('[MatchScraper] Error syncing Cricbuzz matches to DB:', err.message);
        return { success: false, error: err.message };
    }
};

let scraperTimer = null;
let isScrapingInProgress = false;

/**
 * Returns a randomized interval between 60 and 90 minutes (1 hour to 1.5 hours)
 * This prevents anti-bot pattern detection and keeps matches fresh continuously.
 */
const getRandomIntervalMs = () => {
    const minMinutes = 60;
    const maxMinutes = 90;
    const randomMinutes = minMinutes + Math.random() * (maxMinutes - minMinutes);
    return Math.round(randomMinutes * 60 * 1000);
};

/**
 * Executes a scrape and schedules the next random run between 1h and 1.5h
 */
const runScrapeCycle = async () => {
    if (isScrapingInProgress) {
        console.log('[MatchScraper] Scrape already in progress, skipping cycle');
        return;
    }

    isScrapingInProgress = true;
    const startTime = Date.now();
    console.log(`[MatchScraper] 🏏 Starting automated Cricbuzz match scrape at ${new Date().toLocaleTimeString()}...`);

    try {
        const result = await syncCricbuzzMatchesToDB(true);
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
        if (result.success) {
            console.log(`[MatchScraper] ✅ Scrape completed in ${durationSec}s: ${result.totalScraped} matches found (upserted: ${result.upserted}, updated: ${result.modified})`);
        } else {
            console.warn(`[MatchScraper] ⚠️ Scrape warning: ${result.msg || result.error}`);
        }
    } catch (err) {
        console.error('[MatchScraper] ❌ Scrape error:', err.message);
    } finally {
        isScrapingInProgress = false;
        scheduleNextScrape();
    }
};

/**
 * Schedules the next scrape at a random interval between 60 and 90 minutes.
 */
const scheduleNextScrape = () => {
    if (scraperTimer) {
        clearTimeout(scraperTimer);
    }

    const nextDelayMs = getRandomIntervalMs();
    const nextMinutes = (nextDelayMs / 60000).toFixed(1);
    const nextRunTime = new Date(Date.now() + nextDelayMs).toLocaleTimeString();

    console.log(`[MatchScraper] ⏰ Next scrape scheduled in ${nextMinutes} minutes (randomized between 60-90 min) at ~${nextRunTime}`);

    scraperTimer = setTimeout(() => {
        runScrapeCycle();
    }, nextDelayMs);
};

/**
 * Starts the automated background scraper.
 * Runs initial scrape after a brief warm-up delay (20s) to allow DB to connect.
 */
const startMatchScraper = () => {
    if (scraperTimer) {
        console.log('[MatchScraper] Background scraper is already running');
        return;
    }

    console.log('[MatchScraper] 🚀 Initializing automated match scraper (1 to 1.5 hour randomized cycle)...');

    // Initial warm-up run 20 seconds after server start
    scraperTimer = setTimeout(() => {
        runScrapeCycle();
    }, 20000);
};

/**
 * Stops the automated background scraper.
 */
const stopMatchScraper = () => {
    if (scraperTimer) {
        clearTimeout(scraperTimer);
        scraperTimer = null;
        console.log('[MatchScraper] 🛑 Background scraper stopped');
    }
};

module.exports = {
    parseMatchTitle,
    syncCricbuzzMatchesToDB,
    startMatchScraper,
    stopMatchScraper,
    runScrapeCycle
};
