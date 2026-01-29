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

    // Rasi (Sign) - Robust Moon extraction
    // API might return 'Moon' or 'moon' or formattedPlanets array
    // Check planets object first
    let moonObj = planets["Moon"] || planets["moon"] || {};

    // If moon object is empty, check structure
    if (Object.keys(moonObj).length === 0 && chart.moonSign) {
        // Fallback if planets map is missing but moonSign summary exists
        moonObj = { sign: chart.moonSign.english || chart.moonSign.name || chart.moonSign.sign || "Unknown" };
    }

    const rashi = moonObj.sign || moonObj.signName || chart.moonSign?.english || chart.moonSign?.name || "Unknown";
    // Nakshatra
    const nakshatra = moonObj.nakshatra || chart.moonNakshatra?.name || chart.nakshatra?.name || "Unknown";

    // Lords
    // Helper for Title Case (for Signs)
    const toTitleCase = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    // Lords (Normalize)
    const rashiLord = signLords[toTitleCase(rashi)] || "Unknown";
    const nakshatraLord = getStarLord(nakshatra) || "Unknown";

    // Planet Positions Map (PlanetName -> SignName)
    // Normalize keys to TitleCase (e.g. 'Mars') to match RuleEngine 'P["Mars"]'.
    // Normalize values to TitleCase (e.g. 'Aries') for Dignity checks.
    const planetPositions = {};

    // Robust Data Extraction: Handle 'planets' (Object) or 'formattedPlanets' (Array)
    let sourcePlanets = {};

    // 1. Try formattedPlanets FIRST (UI uses this, so it takes precedence)
    if (Array.isArray(chart.formattedPlanets) && chart.formattedPlanets.length > 0) {
        chart.formattedPlanets.forEach(p => {
            if (p.name) sourcePlanets[p.name] = p; // Map by Name
        });
    }

    // 2. If formattedPlanets yielded nothing, Fallback to 'planets' Object (Auto-calc)
    if (Object.keys(sourcePlanets).length === 0 && planets && Object.keys(planets).length > 0) {
        sourcePlanets = planets;
    }

    Object.keys(sourcePlanets).forEach(key => {
        // Key should be Title Case for RuleEngine lookup (e.g. P['Mars'])
        let normalizedKey = toTitleCase(key);

        // Handle array index case or numeric keys
        const val = sourcePlanets[key];

        // If Key is numeric (Array index), check if value has 'name' property
        if (!isNaN(key) && val.name) {
            normalizedKey = toTitleCase(val.name);
        }

        // If the value is an object with 'sign', use it. If string, use directly.
        const signRaw = (typeof val === 'object') ? (val.sign || val.signName || val.currentSign) : val;

        if (signRaw && normalizedKey) {
            // Sign Value must be TitleCase for Exalted/Debilitated/Own Sign checks
            planetPositions[normalizedKey] = toTitleCase(signRaw);
        }
    });

    return {
        rashi: toTitleCase(rashi), // Ensure TitleCase
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
        isRule2Split: engineOutput.status === 'SURE FLOP' || (isBowling && engineOutput.score <= -5),
        isSpecial: engineOutput.isSpecial
    };
};
