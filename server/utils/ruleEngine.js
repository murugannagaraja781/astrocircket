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

    /* ================= RAHU / KETU RULE ================= */
    if (["Rahu", "Ketu"].includes(playerStarLord)) {
        // Base +4
        let points = 4;
        let reasons = ["Base (+4)"];

        // Dignity +4 (Check Player Star Lord dignity in Player Chart)
        if (pStarLordPos_P) {
            const pStarStrong = isStrong(playerStarLord, pStarLordPos_P.longitude);
            if (pStarStrong) {
                points += 4;
                reasons.push("Dignity (+4)");
            }
        }

        addRule(`Rahu/Ketu Rule: ${reasons.join(', ')}`, points);
    }

    /* ================= LAGNA RULE ================= */
    // Match Lagna Lord = Player Rasi Lord
    if (matchLagnaLord === playerRasiLord) {
        let points = 4;
        let reasons = ["Base (+4)"];

        // If dignity present: +4 more
        // Dignity of Player Rasi Lord (in Match Chart - Transit strength)
        if (pRasiLordPos_M) {
            const pRasiStrong = isStrong(playerRasiLord, pRasiLordPos_M.longitude);
            if (pRasiStrong) {
                points += 4;
                reasons.push("Dignity (+4)");
            }
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
        let points = 3;
        // Check if Exalted specifically? (Client logic: +8 if exalted)
        // Using isStrong (Exalted/Own) as general check, but if strict Exalt needed:
        const q = calculateDignity(matchRasiLord, mRasiLordPos_M.longitude).english;
        if (q === 'Exalted') {
            points = 8;
        }
        addRule('Match Sign Lord Rule', points, 'bowl');
    }

    /* ================= FINAL OUTPUT ================= */
    // Net Score
    const netScore = batting.score + bowling.score;

    return {
        batting,
        bowling,
        netScore
    };
};

module.exports = { evaluatePrediction };
