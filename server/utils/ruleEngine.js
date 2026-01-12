const {
    SIGNS,
    PLANET_INFO,
    calculateSign,
    calculateNakshatra,
    calculateDignity,
    calculatePlanetaryPositions
} = require("./astroCalculator");

/* ------------------ HELPERS ------------------ */

const getPlanetPosition = (planet, chart) => {
    const lng = chart.planets[planet];
    if (lng === undefined) return null;
    const sign = calculateSign(lng);
    const nak = calculateNakshatra(lng);
    return {
        name: planet,
        longitude: lng,
        signId: sign.id,
        signLord: sign.lord,
        nakshatra: nak.name,
        nakLord: nak.lord
    };
};

const isConjoined = (a, b) => a && b && a.signId === b.signId;
const isInSigns = (pos, signs) => pos && Array.isArray(signs) && signs.includes(pos.signId);
const getOwnedSigns = (planet) => PLANET_INFO[planet]?.own || [];

const isStrong = (planet, lng) => {
    const q = calculateDignity(planet, lng).english;
    return ["Exalted", "Own Sign", "Mooltrikona"].includes(q);
};

// Start: Helper to check if ANY planet in a sign is Exalted or Own
const hasStrongPlanetInSign = (signId, chartPlanets) => {
    // Iterate all planets in chart, check if in signId AND isStrong
    for (const [pName, pLng] of Object.entries(chartPlanets)) {
        const pSign = calculateSign(pLng).id;
        if (pSign === signId && isStrong(pName, pLng)) {
            return true;
        }
    }
    return false;
};

// Helper: Check if planet A is in B's house
const isInHouseOf = (posA, planetB) => {
    const signs = getOwnedSigns(planetB);
    return isInSigns(posA, signs);
};

/* ------------------ MAIN ENGINE ------------------ */

const evaluatePrediction = (playerBirthChart, matchParams) => {

    /* MATCH CHART */
    const { planets, ascendant } = calculatePlanetaryPositions(
        matchParams.year,
        matchParams.month,
        matchParams.day,
        matchParams.hour,
        matchParams.minute,
        matchParams.latitude,
        matchParams.longitude,
        matchParams.timezone
    );

    const matchChart = {
        planets,
        ascendant,
        moon: getPlanetPosition("Moon", { planets }),
        ascSign: calculateSign(ascendant)
    };

    /* PLAYER MAP */
    const pMap = {};
    for (const [k, v] of Object.entries(playerBirthChart.planets)) {
        pMap[k] = typeof v === "object" ? v.longitude : v;
    }

    const playerChart = {
        planets: pMap,
        moon: getPlanetPosition("Moon", { planets: pMap })
    };

    if (!playerChart.moon || !matchChart.moon)
        throw new Error("Moon missing. Abort.");

    /* BASIC DATA */
    const playerRasi = playerChart.moon.signId;
    const playerStar = playerChart.moon.nakshatra;
    const playerRasiLord = playerChart.moon.signLord;
    const playerStarLord = playerChart.moon.nakLord;

    const matchRasi = matchChart.moon.signId;
    const matchStar = matchChart.moon.nakshatra;
    const matchRasiLord = matchChart.moon.signLord;
    const matchStarLord = matchChart.moon.nakLord;
    const matchLagnaLord = matchChart.ascSign.lord;

    /* POSITIONS */
    const pRasiLordPos_M = getPlanetPosition(playerRasiLord, matchChart);
    const pStarLordPos_M = getPlanetPosition(playerStarLord, matchChart);
    const mRasiLordPos_M = getPlanetPosition(matchRasiLord, matchChart);
    const mStarLordPos_M = getPlanetPosition(matchStarLord, matchChart);
    const mLagnaLordPos_M = getPlanetPosition(matchLagnaLord, matchChart);

    const pRasiLordPos_P = getPlanetPosition(playerRasiLord, playerChart);
    const pStarLordPos_P = getPlanetPosition(playerStarLord, playerChart);
    const mStarLordPos_P = getPlanetPosition(matchStarLord, playerChart);

    /* STATE */
    const batting = { score: 0, rules: [], status: "UNDECIDED" };
    const bowling = { score: 0, rules: [], status: "UNDECIDED" };

    const addRule = (name, score, type = 'both') => {
        // "Affect both batting & bowling unless explicitly stated"
        if (type === 'both' || type === 'bat') {
            batting.score += score;
            batting.rules.push(`${name} (${score > 0 ? '+' : ''}${score})`);
        }
        if (type === 'both' || type === 'bowl') {
            bowling.score += score;
            bowling.rules.push(`${name} (${score > 0 ? '+' : ''}${score})`);
        }
    };

    /* ================= CORE RULES ("11 SPECIAL NAKSHATRA RULES") ================= */
    /* Applied to BOTH Batting and Bowling */

    // Rule 1: ZigZag Rule (+12)
    if (matchRasiLord === playerStarLord && matchStarLord === playerRasiLord) {
        addRule('Rule 1: ZigZag', 12);
    }

    // Rule 2: Conjunction Rule (+4 / +8)
    if (isConjoined(mStarLordPos_M, pRasiLordPos_M) || isConjoined(mStarLordPos_M, pStarLordPos_M)) {
        const strong = isStrong(matchStarLord, mStarLordPos_M.longitude);
        addRule('Rule 2: Conjunction', strong ? 8 : 4);
    }

    // Rule 3: Star Rule (+4 / +8)
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        const strong = isStrong(matchStarLord, mStarLordPos_M.longitude);
        addRule('Rule 3: Star', strong ? 8 : 4);
    }

    // Rule 4: Double Match Rule (+4 / +8)
    if (matchRasiLord === matchStarLord) {
        const strong = isStrong(matchRasiLord, mRasiLordPos_M.longitude);
        addRule('Rule 4: Double Match', strong ? 8 : 4);
    }

    // Rule 5: Same House Rule (+4 / +8)
    if (isInHouseOf(pRasiLordPos_M, matchStarLord) && isInHouseOf(pStarLordPos_M, matchStarLord)) {
        const strong = isStrong(matchStarLord, mStarLordPos_M.longitude);
        addRule('Rule 5: Same House', strong ? 8 : 4);
    }

    // Rule 6: General Conjunction Rule (+4 / +8)
    if (isConjoined(mStarLordPos_P, pRasiLordPos_P) || isConjoined(mStarLordPos_P, pStarLordPos_P)) {
        const strong = isStrong(matchStarLord, mStarLordPos_P.longitude);
        addRule('Rule 6: General Conjunction', strong ? 8 : 4);
    }

    // Special Rule 1: Special Conjunction (+6 / +10)
    // (Kept as part of the core set)
    if (isConjoined(mRasiLordPos_M, mStarLordPos_M) && isInHouseOf(mRasiLordPos_M, playerRasiLord)) {
        const strong = isStrong(matchRasiLord, mRasiLordPos_M.longitude);
        addRule('Special Rule 1', strong ? 10 : 6);
    }

    /* ================= RAHU / KETU RULE ================= */
    // Same as batting (Applies to Both via 'both' or just Batting?)
    // "Affect both... unless explicitly stated"
    // Header says "RAHU / KETU RULE". Text: "Same as batting".
    // I'll apply to BOTH to be safe, or just keep it as a core rule.
    if (["Rahu", "Ketu"].includes(playerStarLord)) {
        // Base +4
        // Dignity +4
        const pStarStrong = isStrong(playerStarLord, pStarLordPos_M.longitude); // Check dignity in Match Chart
        const points = 4 + (pStarStrong ? 4 : 0);
        addRule('Rahu/Ketu Rule', points);
    }

    /* ================= LAGNA RULE ================= */
    // Match Lagna Lord = Player Rasi Lord
    if (matchLagnaLord === playerRasiLord) {
        let points = 4;
        let reasons = ["Base (+4)"];

        // If dignity present: +4 more
        // Dignity of Player Rasi Lord (who is also Match Lagna Lord)
        const pRasiStrong = isStrong(playerRasiLord, pRasiLordPos_M.longitude);
        if (pRasiStrong) {
            points += 4;
            reasons.push("Dignity (+4)");
        }

        // If any planet in that house is exalted / own: +4 more
        // "That house" interpreted as Match Ascendant Sign
        if (hasStrongPlanetInSign(matchChart.ascSign.id, planets)) {
            points += 4;
            reasons.push("Strong Planet in Lagna (+4)");
        }

        addRule(`Lagna Rule: ${reasons.join(', ')}`, points);
    }

    /* ================= MATCH SIGN LORD RULE (BOWLING ONLY) ================= */
    // Match Rasi Lord = Player Rasi Lord
    if (matchRasiLord === playerRasiLord) {
        // If exalted: +8 points (Total 8). Else +3.
        const mRasiStrong = isStrong(matchRasiLord, mRasiLordPos_M.longitude);
        addRule('Match Sign Lord Rule', mRasiStrong ? 8 : 3, 'bowl');
    }

    /* ================= FINAL OUTPUT ================= */
    // Net Score
    const netScore = batting.score + bowling.score;

    // Zero score show 0 (already handled by numeric type)
    // No semantic meaning enforced.

    return {
        batting,
        bowling,
        netScore
    };
};

module.exports = { evaluatePrediction };
