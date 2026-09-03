// predictionAdapter.js
import { evaluateBatsman, evaluateBowler } from './ruleEngine';
import { getFinalResult } from './resultEngine';

// Mapping dictionaries (ensure these match ruleEngine expectations and data)
const signLords = {
    "Aries": "Mars", "Mesha": "Mars",
    "Taurus": "Venus", "Vrishabha": "Venus",
    "Gemini": "Mercury", "Mithuna": "Mercury",
    "Cancer": "Moon", "Karka": "Moon",
    "Leo": "Sun", "Simha": "Sun",
    "Virgo": "Mercury", "Kanya": "Mercury",
    "Libra": "Venus", "Tula": "Venus",
    "Scorpio": "Mars", "Vrishchika": "Mars",
    "Sagittarius": "Jupiter", "Dhanu": "Jupiter",
    "Capricorn": "Saturn", "Makara": "Saturn",
    "Aquarius": "Saturn", "Kumbha": "Saturn",
    "Pisces": "Jupiter", "Meena": "Jupiter"
};

const SIGNS_LIST = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const NAKSHATRAS_LIST = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
    'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const getSignFromDegree = (deg) => {
    if (deg === null || deg === undefined || isNaN(deg)) return 'Unknown';
    const norm = ((parseFloat(deg) % 360) + 360) % 360;
    const idx = Math.floor(norm / 30);
    return SIGNS_LIST[idx] || 'Unknown';
};

const getNakshatraFromDegree = (deg) => {
    if (deg === null || deg === undefined || isNaN(deg)) return 'Unknown';
    const norm = ((parseFloat(deg) % 360) + 360) % 360;
    const idx = Math.floor(norm / (360 / 27)); // 13.333333333333334
    return NAKSHATRAS_LIST[idx] || 'Unknown';
};

const toTitleCase = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'number') {
        return getSignFromDegree(val);
    }
    const str = String(val).trim();
    if (!str) return '';
    if (!isNaN(str) && str !== '') {
        return getSignFromDegree(parseFloat(str));
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const getStarLord = (starName) => {
    if (!starName) return null;
    const n = String(starName).toLowerCase();
    if (['ashwini', 'magha', 'mula', 'moola'].some(s => n.includes(s))) return 'Ketu';
    if (['bharani', 'purva phalguni', 'purvaphalguni', 'purva ashadha', 'purvashada'].some(s => n.includes(s))) return 'Venus';
    if (['krittika', 'uttara phalguni', 'uttaraphalguni', 'uttara ashadha', 'uttarashada'].some(s => n.includes(s))) return 'Sun';
    if (['rohini', 'hasta', 'shravana'].some(s => n.includes(s))) return 'Moon';
    if (['mrigashira', 'mrigashirsha', 'chitra', 'dhanishta'].some(s => n.includes(s))) return 'Mars';
    if (['ardra', 'swati', 'shatabhisha'].some(s => n.includes(s))) return 'Rahu';
    if (['punarvasu', 'vishakha', 'purva bhadrapada', 'purvabhadra'].some(s => n.includes(s))) return 'Jupiter';
    if (['pushya', 'anuradha', 'uttara bhadrapada', 'uttarabhadra'].some(s => n.includes(s))) return 'Saturn';
    if (['ashlesha', 'jyeshtha', 'revati'].some(s => n.includes(s))) return 'Mercury';
    return null;
};

// Helper: Extract Data from Chart Object
const normalizeChart = (chart) => {
    if (!chart) return null;
    const planets = chart.planets || {};

    // 1. Moon & Rashi Extraction
    let moonObj = planets["Moon"] || planets["moon"] || {};
    let rashi = "Unknown";
    let nakshatra = "Unknown";

    if (typeof moonObj === 'number') {
        rashi = getSignFromDegree(moonObj);
        nakshatra = getNakshatraFromDegree(moonObj);
    } else if (typeof moonObj === 'object') {
        if (typeof moonObj.longitude === 'number') {
            rashi = moonObj.sign || moonObj.signName || getSignFromDegree(moonObj.longitude);
            nakshatra = moonObj.nakshatra || getNakshatraFromDegree(moonObj.longitude);
        } else {
            rashi = moonObj.sign || moonObj.signName || chart.moonSign?.english || chart.moonSign?.name || "Unknown";
            nakshatra = moonObj.nakshatra || chart.moonNakshatra?.name || chart.nakshatra?.name || "Unknown";
        }
    } else if (typeof moonObj === 'string') {
        rashi = moonObj;
        nakshatra = chart.moonNakshatra?.name || chart.nakshatra?.name || "Unknown";
    }

    if (rashi === "Unknown" && chart.moonSign) {
        rashi = chart.moonSign.english || chart.moonSign.name || chart.moonSign.sign || "Unknown";
    }

    // 2. Lords
    const rashiLord = signLords[toTitleCase(rashi)] || "Unknown";
    const nakshatraLord = getStarLord(nakshatra) || "Unknown";

    // 3. Planet Positions Map (PlanetName -> SignName)
    const planetPositions = {};
    const sourcePlanets = (Array.isArray(chart.formattedPlanets) && chart.formattedPlanets.length > 0)
        ? chart.formattedPlanets.reduce((acc, p) => { if (p.name) acc[p.name] = p; return acc; }, {})
        : (planets && Object.keys(planets).length > 0) ? planets : {};

    Object.keys(sourcePlanets).forEach(key => {
        let normalizedKey = toTitleCase(key);
        const val = sourcePlanets[key];

        if (!isNaN(key) && val && val.name) normalizedKey = toTitleCase(val.name);

        let signName = 'Unknown';
        if (typeof val === 'number') {
            signName = getSignFromDegree(val);
        } else if (val && typeof val === 'object') {
            if (typeof val.longitude === 'number') {
                signName = val.sign || val.signName || getSignFromDegree(val.longitude);
            } else {
                const signRaw = val.sign || val.signName || val.currentSign || val.signTamil || 'Unknown';
                signName = toTitleCase(signRaw);
            }
        } else if (val) {
            signName = toTitleCase(val);
        }

        if (normalizedKey && signName && signName !== 'Unknown') {
            planetPositions[normalizedKey] = toTitleCase(signName);
        }
    });

    // 4. Lagna / Ascendant extraction
    let ascSign = "Unknown";
    if (typeof chart.ascendant === 'number') {
        ascSign = getSignFromDegree(chart.ascendant);
    } else if (chart.ascendant && typeof chart.ascendant.longitude === 'number') {
        ascSign = chart.ascendant.name || getSignFromDegree(chart.ascendant.longitude);
    } else {
        ascSign = chart.ascendant?.name || chart.ascendant?.sign?.name || chart.ascendantSign || "Unknown";
    }

    const normalizedAscSign = toTitleCase(ascSign);
    const ascLord = chart.ascendant?.lord || chart.ascendant?.sign?.lord || chart.ascendantLord || signLords[normalizedAscSign] || "Unknown";

    return {
        rashi: toTitleCase(rashi),
        nakshatra,
        rashiLord,
        nakshatraLord,
        planetPositions,
        ascendantSign: normalizedAscSign,
        ascendantLord: toTitleCase(ascLord),
        battingLagnaSign: toTitleCase(chart.battingLagnaSign) || normalizedAscSign,
        battingLagnaLord: toTitleCase(chart.battingLagnaLord) || toTitleCase(ascLord),
        bowlingLagnaSign: toTitleCase(chart.bowlingLagnaSign) || normalizedAscSign,
        bowlingLagnaLord: toTitleCase(chart.bowlingLagnaLord) || toTitleCase(ascLord),
        moonNakshatraLord: nakshatraLord,
        role: chart.role,
        matchLagnas: chart.lagnaTimeline || []
    };
};

export const runPrediction = (playerChart, matchChart, role = "BAT") => {
    if (!playerChart || !matchChart) return null;

    const player = normalizeChart(playerChart);
    const match = normalizeChart(matchChart);
    const transit = match; // In this context, match chart IS the transit chart

    if (!player || !match) return null;

    let engineOutput;
    const isBowling = role === "BOWL";

    // --- ROLE BASED FILTERING ---
    const pRole = (player.role || '').toUpperCase();

    // If player is a pure BATSMAN (or WK), they get 0 for Bowling
    // 'BAT' is standard, also checking variations just in case
    const isBatsman = pRole === 'BAT' || pRole === 'BATSMAN' || pRole === 'WK' || pRole === 'WK-BATSMAN';

    if (isBowling && isBatsman) {
        engineOutput = {
            score: 0,
            logs: ["Role Mismatch: Batsman cannot bowl (Score: 0)"],
            status: "FLOP",
            isSpecial: false
        };
    }
    // If player is a pure BOWLER, they get 0 for Batting
    else if (!isBowling && (pRole === 'BOWL' || pRole === 'BOWLER')) {
        engineOutput = {
            score: 0,
            logs: ["Role Mismatch: Bowler cannot bat (Score: 0)"],
            status: "FLOP",
            isSpecial: false
        };
    }
    else {
        // Normal Evaluation for All Rounders, WK-Batsman, or matching roles
        if (isBowling) {
            engineOutput = evaluateBowler(player, match, transit);
        } else {
            engineOutput = evaluateBatsman(player, match, transit);
        }
    }

    const finalResult = getFinalResult(engineOutput.score, isBowling);

    return {
        score: engineOutput.score,
        logs: engineOutput.logs || [],
        report: engineOutput.logs || [], // Map logs to report for UI compatibility
        verdict: finalResult.verdict,
        verdictTamil: finalResult.verdictTamil,
        message: finalResult.message,
        confidence: finalResult.confidence,
        color: finalResult.color,
        // Rule 2 flag for UI to show special split indicator
        isRule2Split: engineOutput.status === 'SURE FLOP' || (isBowling && engineOutput.score <= -5),
        isSpecial: engineOutput.isSpecial,
        matchedLagnas: engineOutput.matchedLagnas,
        matchedNakshatras: engineOutput.matchedNakshatras
    };
};
