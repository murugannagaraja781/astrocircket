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

// Debilitated Signs (நீசம்)
const DEBILITATED_SIGNS = {
    'Sun': 'Libra', 'Moon': 'Scorpio', 'Mars': 'Cancer',
    'Mercury': 'Pisces', 'Jupiter': 'Capricorn', 'Venus': 'Virgo',
    'Saturn': 'Aries', 'Rahu': 'Scorpio', 'Ketu': 'Taurus'
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
    let playerRasiLord = getSignLord(pMoon.sign);
    let playerStarLord = getStarLord(pMoon.nakshatra);
    let playerStar = pMoon.nakshatra;

    // Match Data
    let matchStar = mMoon.nakshatra;
    let matchRasiLord = getSignLord(mMoon.sign);
    let matchStarLord = getStarLord(matchStar);

    /* RAHU / KETU STAR LORD OVERRIDES (Match) per Part 2 */
    if (matchStarLord === 'Rahu' || matchStarLord === 'Ketu') {
        matchStarLord = matchRasiLord;
        if (matchStar && (matchStar.includes('Magha') || matchStar.includes('Magam'))) {
            matchStarLord = 'Mars';
        }
        if (matchStar && (matchStar.includes('Ashwini') || matchStar.includes('Aswini'))) {
            matchStarLord = 'Mars';
        }
    }

    /* RAHU / KETU STAR LORD OVERRIDES (Player) */
    if (playerStarLord === 'Rahu' || playerStarLord === 'Ketu') {
        playerStarLord = playerRasiLord;
    }

    const matchLagnaLord = getSignLord(mLagna?.sign);

    /* STATE */
    let globalNegative = false;

    const addRule = (name, pts) => {
        score += pts;
        report.push(`${name} (${pts > 0 ? '+' : ''}${pts})`);
    };

    const setSureFlop = (name) => {
        globalNegative = true;
        report.push(`${name} (SURE FLOP)`);
    };

    const applyBonuses = (planet, ptsBonus = 4) => {
        const pObj = getPlanet(playerChart, planet);
        if (pObj && (isExalted(planet, pObj.sign) || OWN_SIGNS[planet]?.includes(pObj.sign))) {
            addRule(`${planet} Aatchi/Ucham Bonus`, ptsBonus);
        }
    };

    /* ================= GENERAL BATTING RULES ================= */

    // Rule 1: ZIG-ZAG RULE
    if (matchRasiLord === playerStarLord && matchStarLord === playerRasiLord) {
        addRule('BAT Rule 1: Zig-Zag', 12);
        applyBonuses(playerRasiLord, 4);
    }

    // Rule 2: DIRECT RULE
    if (matchRasiLord === playerRasiLord && matchStarLord === playerStarLord) {
        addRule('BAT Rule 2: Direct', 6);
        applyBonuses(playerRasiLord, 4);
    }

    // Rule 3: STAR RULE
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        addRule('BAT Rule 3: Star', 4);
        applyBonuses(matchStarLord, 4);
    }

    // Rule 4: CONJUNCTION RULE
    const pStarLordObj = getPlanet(playerChart, matchStarLord);
    const pRasiLordObj = getPlanet(playerChart, playerRasiLord);
    if (pStarLordObj && pRasiLordObj && pStarLordObj.sign === pRasiLordObj.sign) {
        addRule('BAT Rule 4: Conjunction', 4);
        applyBonuses(playerRasiLord, 4);
        if (mLagna && mLagna.sign === pMoon.sign) addRule('BAT Rule 4: Lagna Match', 2);
    }

    // Rule 5: SAME HOUSE RULE
    const ownedByMatchStarLord = OWN_SIGNS[matchStarLord] || [];
    const pStarLordSign = getPlanet(playerChart, playerStarLord)?.sign;
    if (ownedByMatchStarLord.includes(pMoon.sign) && ownedByMatchStarLord.includes(pStarLordSign)) {
        addRule('BAT Rule 5: Same House', 4);
        const pRasiLObj = getPlanet(playerChart, playerRasiLord);
        if (pRasiLObj && (isExalted(playerRasiLord, pRasiLObj.sign) || OWN_SIGNS[playerRasiLord]?.includes(pRasiLObj.sign))) addRule('BAT Rule 5: Bonus', 2);
    }

    // Rule 6: PLAYER RASI ATHIPATHI HOME
    const mRasiLObj = getPlanet(matchChart, matchRasiLord);
    const mStarLObj = getPlanet(matchChart, matchStarLord);
    if (mRasiLObj && mStarLObj && mRasiLObj.sign === pMoon.sign && mStarLObj.sign === pMoon.sign) {
        addRule('BAT Rule 6: Player Rasi Home', 6);
        applyBonuses(playerRasiLord, 4);
    }

    // Rule 7: RAHU/KETU PLAYER RULE
    if (pMoon.nakLord === 'Rahu' || pMoon.nakLord === 'Ketu') {
        const ownedByMSL = OWN_SIGNS[matchStarLord] || [];
        if (ownedByMSL.includes(pMoon.sign)) {
            addRule('BAT Rule 7: Rahu/Ketu Player', 4);
            applyBonuses(playerRasiLord, 4);
        }
    }

    // Rule 8: LAGNA RULE (BATTING)
    if (matchLagnaLord === playerRasiLord) {
        addRule('BAT Rule 8: Lagna', 2);
        applyBonuses(playerRasiLord, 2);
    }

    /* ================= GENERAL BOWLING RULES ================= */
    // bowling logic will be similar but with fixed points

    /* ================= MATCH STAR SPECIFIC RULES ================= */

    if (matchStar) {
        // 1. ASWINI
        if (matchStar.includes('Ashwini') || matchStar.includes('Aswini')) {
            const pMars = getPlanet(playerChart, "Mars");
            if (pMars) {
                if (isExalted('Mars', pMars.sign)) addRule('Aswini: Mars Exalted', 8);
                else if (DEBILITATED_SIGNS['Mars'] === pMars.sign) addRule('Aswini: Mars Debilitated', -12);

                const pVenus = getPlanet(playerChart, "Venus");
                if (pVenus && pMars.sign === pVenus.sign) addRule('Aswini: Mars + Venus Conjunction', 10);
            }
        }

        // 2. BHARANI
        else if (matchStar.includes('Bharani')) {
            const pVenus = getPlanet(playerChart, "Venus");
            const pMercury = getPlanet(playerChart, "Mercury");
            if (pVenus && pMercury && pVenus.sign === pMercury.sign) setSureFlop('Bharani: Venus + Mercury Conjunction');
        }

        // 3. ROHINI
        else if (matchStar.includes('Rohini')) {
            if (DEBILITATED_SIGNS['Moon'] === pMoon.sign) addRule('Rohini: Moon Debilitated', 8);
            if (playerStar && (playerStar.includes('Shatabhisha') || playerStar.includes('Sathayam'))) {
                const pSaturn = getPlanet(playerChart, "Saturn");
                const pRahu = getPlanet(playerChart, "Rahu");
                if (pSaturn && pRahu && pSaturn.sign === pRahu.sign) addRule('Rohini: Sathayam Star & Saturn+Rahu Conjunction', 12);
            }
        }

        // 4. THIRUVATHIRAI
        else if (matchStar.includes('Ardra') || matchStar.includes('Thiruvathirai')) {
            if (playerRasiLord === 'Mars' || playerStarLord === 'Mars') addRule('Thiruvathirai: Mars Rasi/Star Lord', 4);
            const pMars = getPlanet(playerChart, "Mars");
            if (pMars && (isOwnSign('Mars', pMars.sign) || isExalted('Mars', pMars.sign))) addRule('Thiruvathirai: Mars Own/Exalted', 10);
        }

        // 5. AYILYAM
        else if (matchStar.includes('Ashlesha') || matchStar.includes('Ayilyam')) {
            const pVenus = getPlanet(playerChart, "Venus");
            const pMercury = getPlanet(playerChart, "Mercury");
            if (pVenus && pMercury && pVenus.sign === pMercury.sign) setSureFlop('Ayilyam: Venus + Mercury Conjunction');
        }

        // 6. MAGAM
        else if (matchStar.includes('Magha') || matchStar.includes('Magam')) {
            if (playerRasiLord === 'Mercury' && playerStarLord === 'Mars') addRule('Magam: Rasi Lord Mercury & Star Lord Mars', 12);
        }

        // 7. POORAM
        else if (matchStar.includes('Purva Phalguni') || matchStar.includes('Pooram')) {
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Pooram: Rasi Lord Saturn & Star Lord Mars (Batting)', 12);
            if (playerRasiLord === 'Jupiter' && playerStarLord === 'Mercury') addRule('Pooram: Rasi Lord Jupiter & Star Lord Mercury (Bowling)', 12);
        }

        // 8. UTHIRAM
        else if (matchStar.includes('Uttara Phalguni') || matchStar.includes('Uthiram')) {
            if (mMoon.sign === 'Virgo' || mMoon.sign === 'Kanya') {
                if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Uthiram (Kanya): Rasi Lord Saturn & Star Lord Rahu', 12);
            }
        }

        // 9. CHITHIRAI
        else if (matchStar.includes('Chitra') || matchStar.includes('Chithirai')) {
            if (mMoon.sign === 'Virgo' || mMoon.sign === 'Kanya') {
                if (playerRasiLord === 'Mercury') {
                    const pSun = getPlanet(playerChart, "Sun");
                    const pMercury = getPlanet(playerChart, "Mercury");
                    if (pSun && pMercury && pSun.sign === pMercury.sign) {
                        const pJupiter = getPlanet(playerChart, "Jupiter");
                        const pVenus = getPlanet(playerChart, "Venus");
                        if (pJupiter && pVenus && pSun.sign === pJupiter.sign && pSun.sign === pVenus.sign) addRule('Chithirai (Virgo): Merc+Sun+Ven+Jup', 12);
                        else if (pJupiter && pSun.sign === pJupiter.sign) addRule('Chithirai (Virgo): Merc+Sun+Jup', 8);
                        else addRule('Chithirai (Virgo): Merc+Sun', 6);
                    }
                }
            } else if (mMoon.sign === 'Libra' || mMoon.sign === 'Tula' || mMoon.sign === 'துலாம்') {
                if (playerRasiLord === 'Moon' && playerStarLord === 'Saturn') addRule('Chithirai (Libra): Rasi Lord Moon & Star Lord Saturn', 12);
            }
        }

        // 10. ANUSHAM
        else if (matchStar.includes('Anuradha') || matchStar.includes('Anusham')) {
            if (playerRasiLord === 'Jupiter') {
                addRule('Anusham: Rasi Lord Jupiter', 5);
                const pJupiter = getPlanet(playerChart, "Jupiter");
                if (pJupiter && (isOwnSign('Jupiter', pJupiter.sign) || isExalted('Jupiter', pJupiter.sign))) addRule('Anusham: Jupiter Own/Exalted', 10);
            }
        }

        // 11. KETTAI
        else if (matchStar.includes('Jyeshtha') || matchStar.includes('Kettai')) {
            const pMercury = getPlanet(playerChart, "Mercury");
            const pVenus = getPlanet(playerChart, "Venus");
            if (pMercury && pVenus && pMercury.sign === pVenus.sign) addRule('Kettai: Mercury + Venus Conjunction', -12);
        }

        // 12. MOOLAM
        else if (matchStar.includes('Mula') || matchStar.includes('Moolam')) {
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Moolam: Rasi Lord Saturn & Star Lord Mars (Batting)', 12);
            if (playerRasiLord === 'Mars' && playerStarLord === 'Saturn') addRule('Moolam: Rasi Lord Mars & Star Lord Saturn (Bowling)', 12);
        }

        // 13. POORADAM
        else if (matchStar.includes('Purva Ashadha') || matchStar.includes('Pooradam')) {
            const pVenus = getPlanet(playerChart, "Venus");
            const pMercury = getPlanet(playerChart, "Mercury");
            if (pVenus && pMercury && pVenus.sign === pMercury.sign) setSureFlop('Pooradam: Venus + Mercury Conjunction');
        }

        // 14. UTHIRADAM
        else if (matchStar.includes('Uttara Ashadha') || matchStar.includes('Uthiradam')) {
            if (mMoon.sign === 'Capricorn' || mMoon.sign === 'Makara') {
                if (playerRasiLord === 'Moon') addRule('Uthiradam (Capricorn): Rasi Lord Moon', 12);
            }
        }

        // 15. THIRUVONAM
        else if (matchStar.includes('Shravana') || matchStar.includes('Thiruvonam')) {
            const pMars = getPlanet(playerChart, "Mars");
            if (playerRasiLord === 'Mars' && pMars && pMars.sign === 'Cancer') addRule('Thiruvonam: Mars in Moon House (Bowling)', 6);
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Thiruvonam: Rasi Lord Saturn & Star Lord Rahu', 12);
        }

        // 16. AVITTAM
        else if (matchStar.includes('Dhanishta') || matchStar.includes('Avittam')) {
            if ((mMoon.sign === 'Capricorn' || mMoon.sign === 'Makara') && playerRasiLord === 'Saturn') addRule('Avittam (Capricorn): Rasi Lord Saturn', 4);
        }

        // 17. SATHAYAM
        else if (matchStar.includes('Shatabhisha') || matchStar.includes('Sathayam')) {
            if (playerRasiLord === 'Moon') addRule('Sathayam: Rasi Lord Moon', 12);
        }
    }

    if (globalNegative) {
        score = 0;
        report.push("GLOBAL OVERRIDE: Score set to 0");
    }

    // --- Final Verdict ---
    let label = "Flop";
    if (score >= 4) label = "Good";
    if (score >= 8) label = "Excellent";
    if (globalNegative) label = "SURE FLOP";

    return { score, label, report };
};

export const evaluateBowler = (playerChart, matchChart) => {
    const report = [];
    let score = 0;

    if (!playerChart || !matchChart) return { score: 0, label: "No Data", report: ["Missing Chart Data"] };

    const pMoon = getPlanet(playerChart, "Moon");
    const mMoon = getPlanet(matchChart, "Moon");
    const mLagna = getPlanet(matchChart, "Asc") || getPlanet(matchChart, "Lagna");

    if (!pMoon || !mMoon) return { score: 0, label: "Error", report: ["Missing Moon Data"] };

    // Player Data
    let playerRasiLord = getSignLord(pMoon.sign);
    let playerStarLord = getStarLord(pMoon.nakshatra);

    // Match Data
    let matchStar = mMoon.nakshatra;
    let matchRasiLord = getSignLord(mMoon.sign);
    let matchStarLord = getStarLord(matchStar);

    /* RAHU / KETU STAR LORD OVERRIDES (Match) */
    if (matchStarLord === 'Rahu' || matchStarLord === 'Ketu') {
        matchStarLord = matchRasiLord;
        if (matchStar && (matchStar.includes('Magha') || matchStar.includes('Magam'))) matchStarLord = 'Mars';
        if (matchStar && (matchStar.includes('Ashwini') || matchStar.includes('Aswini'))) matchStarLord = 'Mars';
    }

    if (playerStarLord === 'Rahu' || playerStarLord === 'Ketu') playerStarLord = playerRasiLord;

    const matchLagnaLord = getSignLord(mLagna?.sign);

    const addRule = (name, pts) => {
        score += pts;
        report.push(`${name} (${pts > 0 ? '+' : ''}${pts})`);
    };

    const applyBonuses = (planet, ptsBonus = 4) => {
        const pObj = getPlanet(playerChart, planet);
        if (pObj && (isExalted(planet, pObj.sign) || OWN_SIGNS[planet]?.includes(pObj.sign))) {
            addRule(`${planet} Aatchi/Ucham Bonus`, ptsBonus);
        }
    };

    /* ================= GENERAL BOWLING RULES ================= */

    // BOWL Rule 1: ZIG-ZAG
    if (matchRasiLord === playerStarLord && matchStarLord === playerRasiLord) {
        addRule('BOWL Rule 1: Zig-Zag', 12);
        applyBonuses(playerRasiLord, 4);
    }

    // BOWL Rule 2: DIRECT (NEGATIVE)
    if (matchRasiLord === playerRasiLord && matchStarLord === playerStarLord) {
        addRule('BOWL Rule 2: Direct (Negative)', -12);
    }

    // BOWL Rule 3: STAR RULE
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        addRule('BOWL Rule 3: Star', 3);
        applyBonuses(matchStarLord, 6);
    }

    // BOWL Rule 4: CONJUNCTION
    const pRasiLordHomeSigns = OWN_SIGNS[playerRasiLord] || [];
    const mStarLordObj = getPlanet(matchChart, matchStarLord);
    if (mStarLordObj && pRasiLordHomeSigns.includes(mStarLordObj.sign)) {
        addRule('BOWL Rule 4: Conjunction', 4);
        applyBonuses(playerRasiLord, 4);
        if (mLagna && mLagna.sign === mStarLordObj.sign) addRule('BOWL Rule 4: Lagna Match', 2);
    }

    // BOWL Rule 5: SAME HOUSE
    const mOwned = [...(OWN_SIGNS[matchRasiLord] || []), ...(OWN_SIGNS[matchStarLord] || [])];
    const pStarLordSign = getPlanet(playerChart, playerStarLord)?.sign;
    if (mOwned.includes(pMoon.sign) && mOwned.includes(pStarLordSign)) {
        addRule('BOWL Rule 5: Same House', 4);
        applyBonuses(playerRasiLord, 2);
    }

    // BOWL Rule 6: PLAYER RASI HOME
    const mRasiLObj = getPlanet(matchChart, matchRasiLord);
    const mStarLObj = getPlanet(matchChart, matchStarLord);
    if (mRasiLObj && mStarLObj && mRasiLObj.sign === pMoon.sign && mStarLObj.sign === pMoon.sign) {
        addRule('BOWL Rule 6: Player Rasi Home', 4);
        applyBonuses(playerRasiLord, 2);
    }

    // BOWL Rule 7: RAHU/KETU RULE
    if (pMoon.nakLord === 'Rahu' || pMoon.nakLord === 'Ketu') {
        const mStarSigns = OWN_SIGNS[matchStarLord] || [];
        if (mStarSigns.includes(pMoon.sign)) {
            addRule('BOWL Rule 7: Rahu/Ketu', 4);
            applyBonuses(playerRasiLord, 4);
        }
    }

    // BOWL Rule 8: LAGNA RULE
    if (matchLagnaLord === playerRasiLord) {
        addRule('BOWL Rule 8: Lagna', 4);
        applyBonuses(playerRasiLord, 4);
        // Exalted/Own Bonus in house
        const planetsInSign = Object.keys(playerChart.planets || {}).filter(p => playerChart.planets[p]?.sign === mLagna?.sign);
        if (planetsInSign.some(p => isExalted(p, playerChart.planets[p].sign) || OWN_SIGNS[p]?.includes(playerChart.planets[p].sign))) {
            addRule('BOWL Rule 8: Planet Bonus', 4);
        }
    }

    // BOWL Rule 9: MATCH SIGN LORD RULE
    if (matchRasiLord === playerRasiLord) {
        addRule('BOWL Rule 9: Match Sign Lord', 3);
        applyBonuses(playerRasiLord, 8);
    }

    // Recalculate Label
    let label = "Flop";
    if (score >= 4) label = "Good";
    if (score >= 8) label = "Excellent";
    if (score <= -4) label = "Sure Flop";

    return { score, label, report };
};

// Export helper for UI
export const getNakshatraLordHelper = getStarLord;
