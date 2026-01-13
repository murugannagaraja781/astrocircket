/**
 * === ASTRO CRICKET PREDICTION RULES ===
 * Refactored based on finalroulse.txt
 */

// --- Constants & Mappings ---

const signLords = {
    "Aries": "Mars", "Mesha": "Mars", "மேஷம்": "Mars",
    "Taurus": "Venus", "Vrishabha": "Venus", "ரிஷபம்": "Venus",
    "Gemini": "Mercury", "Mithuna": "Mercury", "மிதுனம்": "Mercury",
    "Cancer": "Moon", "Karka": "Moon", "கடகம்": "Moon",
    "Leo": "Sun", "Simha": "Sun", "சிம்மம்": "Sun",
    "Virgo": "Mercury", "Kanya": "Mercury", "கன்னி": "Mercury",
    "Libra": "Venus", "Tula": "Venus", "துலாம்": "Venus",
    "Scorpio": "Mars", "Vrishchika": "Mars", "விருச்சிகம்": "Mars",
    "Sagittarius": "Jupiter", "Dhanu": "Jupiter", "தனுசு": "Jupiter",
    "Capricorn": "Saturn", "Makara": "Saturn", "மகரம்": "Saturn",
    "Aquarius": "Saturn", "Kumbha": "Saturn", "கும்பம்": "Saturn",
    "Pisces": "Jupiter", "Meena": "Jupiter", "மீனம்": "Jupiter"
};

// Nakshatra to Lord Mapping
const nakshatraLords = {
    'Ashwini': 'Ketu', 'Magha': 'Ketu', 'Mula': 'Ketu', 'Moola': 'Ketu',
    'Bharani': 'Venus', 'Purva Phalguni': 'Venus', 'Purva Ashadha': 'Venus',
    'Krittika': 'Sun', 'Uttara Phalguni': 'Sun', 'Uttara Ashadha': 'Sun',
    'Rohini': 'Moon', 'Hasta': 'Moon', 'Shravana': 'Moon',
    'Mrigashira': 'Mars', 'Chitra': 'Mars', 'Dhanishta': 'Mars',
    'Ardra': 'Rahu', 'Swati': 'Rahu', 'Shatabhisha': 'Rahu',
    'Punarvasu': 'Jupiter', 'Vishakha': 'Jupiter', 'Purva Bhadrapada': 'Jupiter',
    'Pushya': 'Saturn', 'Anuradha': 'Saturn', 'Uttara Bhadrapada': 'Saturn',
    'Ashlesha': 'Mercury', 'Jyeshtha': 'Mercury', 'Revati': 'Mercury'
};

// Exalted Signs (உச்சம்)
const EXALTED_SIGNS = {
    'Sun': 'Aries', 'Moon': 'Taurus', 'Mars': 'Capricorn',
    'Mercury': 'Virgo', 'Jupiter': 'Cancer', 'Venus': 'Pisces',
    'Saturn': 'Libra', 'Rahu': 'Taurus', 'Ketu': 'Scorpio'
};

// Own Signs (ஆட்சி)
const OWN_SIGNS = {
    'Sun': ['Leo'],
    'Moon': ['Cancer'],
    'Mars': ['Aries', 'Scorpio'],
    'Mercury': ['Gemini', 'Virgo'],
    'Jupiter': ['Sagittarius', 'Pisces'],
    'Venus': ['Taurus', 'Libra'],
    'Saturn': ['Capricorn', 'Aquarius'],
    'Rahu': ['Aquarius'],
    'Ketu': ['Scorpio']
};

// --- Helper Functions ---

export const getStarLord = (starName) => {
    if (!starName) return null;
    const n = starName.toLowerCase();

    for (const [nakshatra, lord] of Object.entries(nakshatraLords)) {
        if (n.includes(nakshatra.toLowerCase())) return lord;
    }
    return null;
};

export const getSignLord = (signName) => {
    if (!signName) return null;
    return signLords[signName] || null;
};

const getPlanet = (chart, planetName) => {
    if (!chart || !chart.planets) return null;
    if (planetName === 'Ascendant' || planetName === 'Lagna' || planetName === 'Asc') {
        return chart.planets["Asc"] || chart.planets["Lagna"] || null;
    }
    return chart.planets[planetName];
};

const isExalted = (planetName, signName) => {
    return EXALTED_SIGNS[planetName] === signName;
};

const isOwnSign = (planetName, signName) => {
    return OWN_SIGNS[planetName]?.includes(signName) || false;
};

const isExaltedOrOwn = (planetName, signName) => {
    if (isExalted(planetName, signName)) return { status: 'EXALTED', tamil: 'உச்சம்' };
    if (isOwnSign(planetName, signName)) return { status: 'OWN_SIGN', tamil: 'ஆட்சி' };
    return null;
};

// Helper: Check if planet is strong (Exalted or Own)
const isStrong = (planetName, signName) => {
    return isExalted(planetName, signName) || isOwnSign(planetName, signName);
};

// Helper: Check if ANY planet in a specific house (sign) is Exalted or Own
const hasStrongPlanetInHouse = (chart, signName) => {
    if (!chart || !chart.planets) return false;
    for (const [name, data] of Object.entries(chart.planets)) {
        if (data.sign === signName) {
            if (isStrong(name, data.sign)) return true;
        }
    }
    return false;
};

// === MAIN PREDICTION ENGINE ===

export const evaluateBatsman = (playerChart, matchChart) => {
    const report = [];
    let score = 0;

    if (!playerChart || !matchChart) {
        return { score: 0, label: "No Data", report: ["Missing Chart Data"] };
    }

    // --- Extract Data ---
    const pMoon = getPlanet(playerChart, "Moon");
    const mMoon = getPlanet(matchChart, "Moon");
    const mLagna = getPlanet(matchChart, "Asc") || getPlanet(matchChart, "Lagna");

    if (!pMoon || !mMoon) {
        return { score: 0, label: "Error", report: ["Missing Moon Data"] };
    }

    // Player Data
    const playerRasiLord = getSignLord(pMoon.sign);
    const playerStarLord = getStarLord(pMoon.nakshatra);

    // Match Data
    const matchRasiLord = getSignLord(mMoon.sign);
    // const matchStarLord = getStarLord(mMoon.nakshatra); // Not used in new rules directly? Keep in case.

    // Match Lagna Data
    const matchLagnaRasi = mLagna?.sign;
    const matchLagnaLord = getSignLord(matchLagnaRasi);

    // ═══════════════════════════════════════════════════════════════════
    // 1. RAHU / KETU RULE
    // If Player Star Lord is Rahu or Ketu
    // ═══════════════════════════════════════════════════════════════════
    if (playerStarLord === 'Rahu' || playerStarLord === 'Ketu') {
        score += 4;
        let log = `Rahu/Ketu Rule: பிளேயர் நட்சத்திர அதிபதி ${playerStarLord} (+4)`;

        // Dignity Check (Check Rahu/Ketu dignity in Player Chart?)
        // Usually dignity is checked where the planet is positioned.
        // Assuming we check the Player's Rahu/Ketu dignity in the PLAYER chart.
        const pStarLordObj = getPlanet(playerChart, playerStarLord);
        if (pStarLordObj) {
            const dignity = isExaltedOrOwn(playerStarLord, pStarLordObj.sign);
            if (dignity) {
                score += 4;
                log += `, Dignity (${dignity.tamil}) ok (+4)`;
            }
        }
        report.push(log);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. LAGNA RULE
    // If Match Lagna Lord = Player Rasi Lord
    // ═══════════════════════════════════════════════════════════════════
    if (matchLagnaLord && playerRasiLord && matchLagnaLord === playerRasiLord) {
        score += 4;
        let log = `Lagna Rule: மேட்ச் லக்னாதிபதி = பிளேயர் ராசி அதிபதி (${matchLagnaLord}) (+4)`;

        // If dignity present (Player Rasi Lord's dignity in Match Chart? Or Player Chart?)
        // "If dignity present": Logic implies checking the Planet (Player Rasi Lord) strength.
        // Standard practice: Check planet status in the MATCH chart (transit).
        const pRasiLordInMatch = getPlanet(matchChart, playerRasiLord);
        if (pRasiLordInMatch) {
            const dignity = isExaltedOrOwn(playerRasiLord, pRasiLordInMatch.sign);
            if (dignity) {
                score += 4;
                log += `, Dignity (${dignity.tamil}) (+4)`;
            }
        }

        // If any planet in that house is exalted / own: +4 more
        // "That house" = Match Lagna House
        if (matchLagnaRasi) {
            const hasStrong = hasStrongPlanetInHouse(matchChart, matchLagnaRasi);
            if (hasStrong) {
                score += 4;
                log += `, Strong Planet in Lagna (+4)`;
            }
        }
        report.push(log);
    }

    // --- Final Verdict ---
    let label = "Flop";
    if (score >= 4) label = "Good"; // Adjusted scale slightly for new points?
    if (score >= 8) label = "Excellent";

    return { score, label, report };
};

export const evaluateBowler = (playerChart, matchChart) => {
    // START with Batting Rules (Common Rules)
    const baseResult = evaluateBatsman(playerChart, matchChart);
    let { score, report } = baseResult;

    if (!playerChart || !matchChart) return baseResult;

    const pMoon = getPlanet(playerChart, "Moon");
    const mMoon = getPlanet(matchChart, "Moon");

    if (!pMoon || !mMoon) return baseResult;

    const playerRasiLord = getSignLord(pMoon.sign);
    const matchRasiLord = getSignLord(mMoon.sign);

    // ═══════════════════════════════════════════════════════════════════
    // 3. MATCH SIGN LORD RULE (BOWLING ONLY)
    // If Match Rasi Lord = Player Rasi Lord
    // ═══════════════════════════════════════════════════════════════════
    if (matchRasiLord && playerRasiLord && matchRasiLord === playerRasiLord) {
        score += 3;
        let log = `Match Sign Lord Rule: மேட்ச் ராசி அதிபதி = பிளேயர் ராசி அதிபதி (${matchRasiLord}) (+3)`;

        // If exalted: +8 points
        // Check if Match Rasi Lord is Exalted in Match Chart?
        const mRasiLordObj = getPlanet(matchChart, matchRasiLord);
        if (mRasiLordObj && isExalted(matchRasiLord, mRasiLordObj.sign)) {
            score += 8;
            log += `, Exalted (உச்சம்) (+8)`;
        }
        report.push(log);
    }

    // Recalculate Label
    let label = "Flop";
    if (score >= 4) label = "Good";
    if (score >= 8) label = "Excellent";

    return { score, label, report };
};

// Export helper for UI
export const getNakshatraLordHelper = getStarLord;
