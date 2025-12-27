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

const getStarLord = (starName) => {
    if (!starName) return null;
    const n = starName.toLowerCase();
    if (['ashwini', 'magha', 'mula', 'moola'].some(s => n.includes(s))) return 'Ketu';
    if (['bharani', 'purva phalguni', 'purvaphalguni', 'purva ashadha', 'purvashada'].some(s => n.includes(s))) return 'Venus';
    if (['krittika', 'uttara phalguni', 'uttaraphalguni', 'uttara ashadha', 'uttarashada'].some(s => n.includes(s))) return 'Sun';
    if (['rohini', 'hasta', 'shravana'].some(s => n.includes(s))) return 'Moon';
    if (['mrigashira', 'chitra', 'dhanishta'].some(s => n.includes(s))) return 'Mars';
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
    const moon = planets["Moon"] || {};

    // Rasi (Sign)
    const rashi = moon.sign || chart.moonSign?.english || "Unknown";
    // Nakshatra
    const nakshatra = moon.nakshatra || chart.moonNakshatra?.name || "Unknown";

    // Lords
    const rashiLord = signLords[rashi] || "Unknown";
    const nakshatraLord = getStarLord(nakshatra) || "Unknown";

    // Planet Positions Map (PlanetName -> SignName)
    const planetPositions = {};
    Object.keys(planets).forEach(key => {
        planetPositions[key] = planets[key].sign;
    });

    return {
        rashi,
        nakshatra,
        rashiLord,
        nakshatraLord,
        planetPositions,
        moonNakshatraLord: nakshatraLord // for transit.moonNakshatraLord usage
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

    if (isBowling) {
        engineOutput = evaluateBowler(player, match, transit);
    } else {
        engineOutput = evaluateBatsman(player, match, transit);
    }

    const finalResult = getFinalResult(engineOutput.score, isBowling);

    return {
        score: engineOutput.score,
        logs: engineOutput.logs,
        verdict: finalResult.verdict,
        verdictTamil: finalResult.verdictTamil,
        message: finalResult.message,
        confidence: finalResult.confidence,
        color: finalResult.color,
        // Rule 2 flag for UI to show special split indicator
        isRule2Split: engineOutput.rule2Applied || (isBowling && engineOutput.score <= -5)
    };
};
