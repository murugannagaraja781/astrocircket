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

const isInSigns = (pos, signs) =>
    pos && Array.isArray(signs) && signs.includes(pos.signId);

const getOwnedSigns = (planet) =>
    PLANET_INFO[planet]?.own || [];

const isStrong = (planet, lng) => {
    const q = calculateDignity(planet, lng).english;
    return ["Exalted", "Own Sign", "Mooltrikona"].includes(q);
};

// Helper: Check if planet A is in B's house
const isInHouseOf = (posA, planetB) => {
    const signs = getOwnedSigns(planetB);
    return isInSigns(posA, signs);
};

const finalizeStatus = (score) => {
    if (score >= 12) return "EXCELLENT";
    if (score >= 8) return "VERY GOOD";
    if (score >= 4) return "GOOD";
    if (score >= 2) return "AVERAGE";
    if (score < 0 && score > -5) return "FLOP";
    if (score <= -5) return "SURE FLOP";
    return "FLOP"; // Default for 0-1 range if not covered strictly (though 0,1 is technically <2 logic usually implies user specific ranges)
    // Adjusting based on user request:
    // >= 12 Excellent
    // >= 8 Very Good
    // >= 4 Good
    // >= 2 Average
    // < 0 Flop
    // <= -5 Sure Flop
    // Gap 0-1: Treat as Average or Flop? Usually <2 implies 0 and 1 are below Average.
    // User said < 0 is Flop. So 0 and 1 are undefined? Assuming "Average" is 2+. So 0,1 might be "Weak" or just "Average".
    // Let's treat 0-1 as "AVERAGE" (or "BELOW AVERAGE" if we had it, but let's stick to "AVERAGE" for non-negative positive).
    // Actually, user explicitly said < 0 Flop. So 0 is not Flop.
    return "AVERAGE";
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
    // Player planets in Match Chart context (Transit) - NOT USED for natal positions usually,
    // but some rules imply "Player Rasi Lord" position in Match Chart.
    // We need both Natal positions and Transit positions?
    // Most rules imply Transit (Match Chart) positions of these lords.
    // Rule 6 Explicity says "Player Jathagathil" (in Player Horoscope).

    // POSITIONS IN MATCH CHART (Transit)
    const pRasiLordPos_M = getPlanetPosition(playerRasiLord, matchChart);
    const pStarLordPos_M = getPlanetPosition(playerStarLord, matchChart);
    const mRasiLordPos_M = getPlanetPosition(matchRasiLord, matchChart);
    const mStarLordPos_M = getPlanetPosition(matchStarLord, matchChart);
    const mLagnaLordPos_M = getPlanetPosition(matchLagnaLord, matchChart);

    // POSITIONS IN PLAYER CHART (Natal)
    const pRasiLordPos_P = getPlanetPosition(playerRasiLord, playerChart);
    const pStarLordPos_P = getPlanetPosition(playerStarLord, playerChart);
    const mStarLordPos_P = getPlanetPosition(matchStarLord, playerChart); // Match Star Lord in Player Chart

    /* STATE */
    const batting = { score: 0, rules: [], status: "UNDECIDED" };
    const bowling = { score: 0, rules: [], status: "UNDECIDED" };

    const addRule = (type, name, score, isStrongRule = false) => {
        const finalScore = isStrongRule ? (score === 4 ? 8 : (score === 6 ? 10 : score + 2)) : score;
        // Logic check: User specified different Strong bonuses.
        // +4 -> +8
        // +6 -> +10
        // +3 -> +3 (Bowler B1 is +1 -> +3)
        // Let's pass exact points.
        if (type === 'bat') {
            batting.score += score;
            batting.rules.push(`${name} (${score > 0 ? '+' : ''}${score})`);
        } else {
            bowling.score += score;
            bowling.rules.push(`${name} (${score > 0 ? '+' : ''}${score})`);
        }
    };

    /* ================= BATTING RULES ================= */

    // Rule 1: ZigZag Rule (+12)
    // Match Rasi Lord matches Player Star Lord AND Match Star Lord matches Player Rasi Lord
    if (matchRasiLord === playerStarLord && matchStarLord === playerRasiLord) {
        addRule('bat', 'Rule 1: ZigZag', 12);
    }

    // Rule 2: Conjunction Rule (+4 / +8)
    // Match Star Lord conjoined Player Rasi Lord OR Player Star Lord (in Match Chart)
    if (isConjoined(mStarLordPos_M, pRasiLordPos_M) || isConjoined(mStarLordPos_M, pStarLordPos_M)) {
        const strong = isStrong(matchStarLord, mStarLordPos_M.longitude);
        addRule('bat', 'Rule 2: Conjunction', strong ? 8 : 4);
    }

    // Rule 3: Star Rule (+4 / +8)
    // Match Star Lord matches Player Rasi Lord OR Player Star Lord
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        // Strength of Match Star Lord in Match Chart
        const strong = isStrong(matchStarLord, mStarLordPos_M.longitude);
        addRule('bat', 'Rule 3: Star', strong ? 8 : 4);
    }

    // Rule 4: Double Match Rule (+4 / +8)
    // Match Rasi Lord == Match Star Lord
    if (matchRasiLord === matchStarLord) {
        const strong = isStrong(matchRasiLord, mRasiLordPos_M.longitude);
        addRule('bat', 'Rule 4: Double Match', strong ? 8 : 4);
    }

    // Rule 5: Same House Rule (+4 / +8)
    // Player Rasi Lord AND Player Star Lord both in Match Star Lord's house (in Match Chart)
    if (isInHouseOf(pRasiLordPos_M, matchStarLord) && isInHouseOf(pStarLordPos_M, matchStarLord)) {
        // Strength of Match Star Lord? Or the result? User says "Strong Planet -> +8". Assuming Match Star Lord strength.
        const strong = isStrong(matchStarLord, mStarLordPos_M.longitude);
        addRule('bat', 'Rule 5: Same House', strong ? 8 : 4);
    }

    // Rule 6: General Conjunction Rule (+4 / +8)
    // Match Star Lord in PLAYER CHART is conjoined with Player Rasi Lord OR Player Star Lord
    if (isConjoined(mStarLordPos_P, pRasiLordPos_P) || isConjoined(mStarLordPos_P, pStarLordPos_P)) {
        // Strength of Match Star Lord in PLAYER CHART?
        const strong = isStrong(matchStarLord, mStarLordPos_P.longitude);
        addRule('bat', 'Rule 6: General Conjunction', strong ? 8 : 4);
    }

    // Rule 7: Lagna Rule (+4 / +8)
    // Player Rasi Lord == Match Lagna Lord
    if (playerRasiLord === matchLagnaLord) {
        const strong = isStrong(playerRasiLord, pRasiLordPos_M.longitude);
        addRule('bat', 'Rule 7: Lagna', strong ? 8 : 4);
    }

    // Special Rule 1: Special Conjunction (+6 / +10)
    // Match Rasi Lord AND Match Star Lord conjoined in Player Rasi Lord's house (in Match Chart)
    if (isConjoined(mRasiLordPos_M, mStarLordPos_M) && isInHouseOf(mRasiLordPos_M, playerRasiLord)) {
        // Strength: if the conjunction is strong? Or if Player Rasi Lord is strong?
        // Usually "Strong Planet" refers to the active planet. Here Match Rasi & Star are active.
        // Let's check if Match Rasi Lord is strong.
        const strong = isStrong(matchRasiLord, mRasiLordPos_M.longitude); // Representative
        addRule('bat', 'Special Rule 1', strong ? 10 : 6);
    }

    // Fallback Rule: Backup Match (+4 / +8)
    // Match Rasi + Star Lords combined -> Agreement with Player Rasi Lord
    // Interpretation: Match Rasi & Star Conjoined AND (Conjoined with Player Rasi Lord OR In Player Rasi Lord House? No, Special covers House).
    // Using "Conjoined with Player Rasi Lord" (Triple Conjunction)
    if (isConjoined(mRasiLordPos_M, mStarLordPos_M) && isConjoined(mRasiLordPos_M, pRasiLordPos_M)) {
        const strong = isStrong(matchRasiLord, mRasiLordPos_M.longitude);
        addRule('bat', 'Fallback Rule', strong ? 8 : 4);
    }

    // Exception Rule: Rahu / Ketu
    if (["Rahu", "Ketu"].includes(playerStarLord)) {
        // "Support rules" -> +2. Else FLOP.
        // Interpretation: If Player Star Lord is Rahu/Ketu, check if it is "Supported".
        // Supported usually means in a friendly sign or conjoined with benefic?
        // Let's use: Is Rahu/Ketu in a sign owned by Match Star Lord (as per previous Tier 2 logic)?
        // Previous logic: if (isInSigns(pRasiLordPos, getOwnedSigns(matchStarLord)))
        if (isInHouseOf(pStarLordPos_M, matchStarLord)) {
            addRule('bat', 'Exception: Rahu/Ketu Support', 2);
        } else {
            // FLOP
            // How to handle FLOP? Set score to negative or simple add "FLOP" status?
            // User says: "Support illaiyenil -> FLOP".
            // We can force status or apply large negative?
            // Let's add a visual rule and maybe override status later.
            // But batting.score is cumulative. Use a flag?
            // Or simply:
            batting.forceFlop = true;
            addRule('bat', 'Exception: Rahu/Ketu Fail', 0);
        }
    }


    /* ================= BOWLING RULES ================= */

    // Special Rule 1 (Bowling): (+6 / +10)
    // Match Rasi + Star Lords inside Player Rasi Lord House
    if (isConjoined(mRasiLordPos_M, mStarLordPos_M) && isInHouseOf(mRasiLordPos_M, playerRasiLord)) {
        const strong = isStrong(matchRasiLord, mRasiLordPos_M.longitude);
        addRule('bowl', 'Special Rule 1 (Bowl)', strong ? 10 : 6);
    }

    // Rule B1: Bowling Excellent (+1 / +3)
    // Match Moon Sign == Player Moon Sign
    if (matchRasi === playerRasi) {
        // "Strong Moon"
        const strong = isStrong("Moon", matchChart.moon.longitude);
        addRule('bowl', 'Rule B1: Same Moon', strong ? 3 : 1);
    }

    // Rule B2: Dual Lord House (+4)
    // Player Rasi Lord AND Player Star Lord in Match Rasi Lord House
    if (isInHouseOf(pRasiLordPos_M, matchRasiLord) && isInHouseOf(pStarLordPos_M, matchRasiLord)) {
        addRule('bowl', 'Rule B2: Dual Lord House', 4);
    }

    // Rule B3: Rasi Lord in Lagna (+3)
    // Player Rasi Lord in Match Lagna Sign
    if (pRasiLordPos_M.signId === matchChart.ascSign.id) {
        addRule('bowl', 'Rule B3: Rasi Lord in Lagna', 3);
    }

    // Rule B4: Lagna Conjunction (+3)
    // Player Rasi Lord conjoined Match Lagna Lord
    if (isConjoined(pRasiLordPos_M, mLagnaLordPos_M)) {
        addRule('bowl', 'Rule B4: Lagna Conjunction', 3);
    }

    // Rule B5: Lagna Match Rule (+3)
    // Match Rasi Lord == Match Lagna Lord AND Player Lord matches Lagna Lord
    if ((matchRasiLord === matchLagnaLord) && (playerRasiLord === matchLagnaLord || playerStarLord === matchLagnaLord)) {
        addRule('bowl', 'Rule B5: Lagna Match', 3);
    }

    // Negative Rule: Same Rasi & Star (FLOP / -1)
    if (matchRasi === playerRasi && matchStar === playerStar) {
        bowling.forceFlop = true;
        addRule('bowl', 'Negative Rule: Same Rasi+Star', -1);
    }


    /* ------------------ FINALIZE ------------------ */

    batting.status = batting.forceFlop ? "FLOP" : finalizeStatus(batting.score);
    bowling.status = bowling.forceFlop ? "FLOP" : finalizeStatus(bowling.score);

    return { batting, bowling };
};

module.exports = { evaluatePrediction };
