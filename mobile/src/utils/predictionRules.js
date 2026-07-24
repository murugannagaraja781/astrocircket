/**
 * === ASTRO CRICKET PREDICTION RULES ===
 * விதி இயந்திரம் - Vedic Astrology Prediction Rules for Cricket
 *
 * Match Base Data Required:
 * - Match Date, Time, Place
 * - Match Moon Rasi & Star (Rasi Athibathi + Star Athibathi)
 * - Match Lagna Rasi & Star (Lagna Athibathi + Lagna Star Athibathi)
 *
 * Player Data Required:
 * - Player Sign Lord (ராசி அதிபதி)
 * - Player Star Lord (நட்சத்திர அதிபதி)
 * - Player planets positions for conjunction check
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

// Check if two planets are in the same sign (conjunction)
const areConjunct = (chart, planet1, planet2) => {
    const p1 = getPlanet(chart, planet1);
    const p2 = getPlanet(chart, planet2);
    if (!p1 || !p2) return false;
    return p1.sign === p2.sign;
};

// Check if a planet is in a sign owned by another planet
const isInHouseOf = (chart, planetToCheck, ownerPlanet) => {
    const p = getPlanet(chart, planetToCheck);
    if (!p) return false;
    const signOwner = getSignLord(p.sign);
    return signOwner === ownerPlanet;
};

// === MAIN PREDICTION ENGINE ===

/**
 * Evaluate Both Batting and Bowling
 * Common Rules for Both
 */
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
    const matchStarLord = getStarLord(mMoon.nakshatra);

    // Match Lagna Data
    const matchLagnaRasi = mLagna?.sign;
    const matchLagnaLord = getSignLord(matchLagnaRasi);

    // ═══════════════════════════════════════════════════════════════════
    // RULE 1: ZIG ZAG RULE (5 Points - EXCELLENT)
    // Match Rasi+Star Lords ↔ Player Rasi+Star Lords (Reverse Match)
    // Ex: Match = Guru + Pudhan, Player = Pudhan + Guru
    // ═══════════════════════════════════════════════════════════════════
    if (matchRasiLord && matchStarLord && playerRasiLord && playerStarLord) {
        if (matchRasiLord === playerStarLord && matchStarLord === playerRasiLord) {
            score += 5;
            report.push(`Rule 1 (ZigZag): மேட்ச் (${matchRasiLord}+${matchStarLord}) ↔ பிளேயர் (${playerRasiLord}+${playerStarLord}) → EXCELLENT (+5)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 2: STAR RULE (2-4 Points)
    // Match Star Lord = Player Sign Lord OR Player Star Lord
    // பிளேயரின் ராசி அதிபதி or நட்சத்திர அதிபதி உடன் மேட்ச் நட்சத்திர அதிபதி இணைந்து உள்ளதா
    // ═══════════════════════════════════════════════════════════════════
    if (matchStarLord && (playerRasiLord || playerStarLord)) {
        let rule2Matched = false;
        let matchedWith = '';
        let matchedPlanet = null;

        // Check if Match Star Lord = Player Rasi Lord
        if (matchStarLord === playerRasiLord) {
            rule2Matched = true;
            matchedWith = 'ராசி அதிபதி';
            matchedPlanet = playerRasiLord;
        }
        // Check if Match Star Lord = Player Nakshatra Lord
        else if (matchStarLord === playerStarLord) {
            rule2Matched = true;
            matchedWith = 'நட்சத்திர அதிபதி';
            matchedPlanet = playerStarLord;
        }

        if (rule2Matched) {
            const matchedPlanetObj = getPlanet(playerChart, matchedPlanet);
            const dignity = matchedPlanetObj ? isExaltedOrOwn(matchedPlanet, matchedPlanetObj.sign) : null;

            if (dignity) {
                score += 4;
                report.push(`Rule 2 (Star): மேட்ச் நட்சத்திர அதிபதி (${matchStarLord}) = பிளேயர் ${matchedWith}, ${dignity.tamil} → GOOD (+4)`);
            } else {
                score += 2;
                report.push(`Rule 2 (Star): மேட்ச் நட்சத்திர அதிபதி (${matchStarLord}) = பிளேயர் ${matchedWith} (${matchedPlanet}) → GOOD (+2)`);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 3: PLAYER SIGN LORD HOUSE RULE (2 Points)
    // Player Rasi Lord's house has both Match Rasi Lord & Match Star Lord
    // (Match Rasi+Star Lords are same)
    // ═══════════════════════════════════════════════════════════════════
    if (matchRasiLord && matchStarLord && matchRasiLord === matchStarLord) {
        score += 2;
        report.push(`Rule 3 (House): மேட்ச் ராசி அதிபதி + நட்சத்திர அதிபதி ஒன்று (${matchRasiLord}) → GOOD (+2)`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 4: SAME HOUSE RULE (3 Points)
    // Player Sign Lord AND Star Lord in Match Star Lord's house
    // ═══════════════════════════════════════════════════════════════════
    if (matchStarLord && playerRasiLord && playerStarLord) {
        const pRasiLordInMatchStarHouse = isInHouseOf(playerChart, playerRasiLord, matchStarLord);
        const pStarLordInMatchStarHouse = isInHouseOf(playerChart, playerStarLord, matchStarLord);

        if (pRasiLordInMatchStarHouse || pStarLordInMatchStarHouse) {
            score += 3;
            report.push(`Rule 4 (SameHouse): பிளேயர் அதிபதி(கள்) மேட்ச் நட்சத்திர அதிபதி (${matchStarLord}) வீட்டில் → GOOD (+3)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 5: CONJUNCTION RULE (2-4 Points)
    // Match Star Lord conjunct with Player Rasi Lord OR Star Lord
    // ═══════════════════════════════════════════════════════════════════
    if (matchStarLord && playerRasiLord) {
        // Check in Player Chart if these planets are conjunct
        const mStarLordInPlayer = getPlanet(playerChart, matchStarLord);
        const pRasiLordObj = getPlanet(playerChart, playerRasiLord);
        const pStarLordObj = getPlanet(playerChart, playerStarLord);

        let conjunctFound = false;
        let conjunctPlanet = '';

        if (mStarLordInPlayer && pRasiLordObj && mStarLordInPlayer.sign === pRasiLordObj.sign) {
            conjunctFound = true;
            conjunctPlanet = playerRasiLord;
        } else if (mStarLordInPlayer && pStarLordObj && mStarLordInPlayer.sign === pStarLordObj.sign) {
            conjunctFound = true;
            conjunctPlanet = playerStarLord;
        }

        if (conjunctFound) {
            const dignityCheck = isExaltedOrOwn(conjunctPlanet, getPlanet(playerChart, conjunctPlanet)?.sign);
            if (dignityCheck) {
                score += 4;
                report.push(`Rule 5 (Conjunction): மேட்ச் நட்சத்திர அதிபதி (${matchStarLord}) + பிளேயர் (${conjunctPlanet}) இணைப்பு, ${dignityCheck.tamil} → GOOD (+4)`);
            } else {
                score += 2;
                report.push(`Rule 5 (Conjunction): மேட்ச் நட்சத்திர அதிபதி (${matchStarLord}) + பிளேயர் (${conjunctPlanet}) இணைப்பு → GOOD (+2)`);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 6: LAGNA RULE (2-4 Points)
    // Match Lagna Rasi = Player Sign Lord's Sign
    // ═══════════════════════════════════════════════════════════════════
    if (matchLagnaRasi && playerRasiLord) {
        const playerRasiLordObj = getPlanet(playerChart, playerRasiLord);

        if (playerRasiLordObj && playerRasiLordObj.sign === matchLagnaRasi) {
            const dignityCheck = isExaltedOrOwn(playerRasiLord, playerRasiLordObj.sign);
            if (dignityCheck) {
                score += 4;
                report.push(`Rule 6 (Lagna): மேட்ச் லக்னம் (${matchLagnaRasi}) = பிளேயர் ராசி அதிபதி இடம், ${dignityCheck.tamil} → GOOD (+4)`);
            } else {
                score += 2;
                report.push(`Rule 6 (Lagna): மேட்ச் லக்னம் (${matchLagnaRasi}) ல் பிளேயர் ராசி அதிபதி (${playerRasiLord}) → GOOD (+2)`);
            }
        }
    }

    // --- Final Verdict ---
    let label = "Flop";
    if (score >= 5) label = "Excellent";
    else if (score >= 3) label = "Very Good";
    else if (score >= 2) label = "Good";
    else if (score >= 1) label = "Average";

    return { score, label, report };
};

// Bowling uses the same rules
export const evaluateBowler = (playerChart, matchChart) => {
    // Same rules apply for bowling
    return evaluateBatsman(playerChart, matchChart);
};

// Export helper for UI
export const getNakshatraLordHelper = getStarLord;
