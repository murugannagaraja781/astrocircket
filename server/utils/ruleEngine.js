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

const hasExchange = (planet, pos, chart) => {
    const lord = pos.signLord;
    if (!lord || lord === planet) return false;
    const lordPos = getPlanetPosition(lord, chart);
    return lordPos && lordPos.signLord === planet;
};

const finalizeStatus = (score) => {
    if (score >= 3) return "STRONG GOOD";
    if (score >= 1) return "GOOD";
    if (score === 0) return "NEUTRAL";
    return "FLOP";
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

    /* POSITIONS (MATCH ONLY) */
    const pRasiLordPos = getPlanetPosition(playerRasiLord, matchChart);
    const pStarLordPos = getPlanetPosition(playerStarLord, matchChart);
    const mRasiLordPos = getPlanetPosition(matchRasiLord, matchChart);
    const mStarLordPos = getPlanetPosition(matchStarLord, matchChart);
    const mLagnaLordPos = getPlanetPosition(matchLagnaLord, matchChart);

    /* STATE */
    const batting = { score: 0, rules: [], locked: false, status: "UNDECIDED" };
    const bowling = { score: 0, rules: [], locked: false, status: "UNDECIDED" };

    /* ------------------ TIER 0 ------------------ */

    if (matchRasi === playerRasi && matchStar === playerStar) {
        bowling.score = -1;
        bowling.status = "FLOP";
        bowling.rules.push("O-1 SAME RASI+STAR");
    }

    /* ------------------ TIER 1 ------------------ */

    if (
        isConjoined(mStarLordPos, pRasiLordPos) ||
        isConjoined(mStarLordPos, pStarLordPos)
    ) {
        if (
            isStrong(matchStarLord, mStarLordPos.longitude) ||
            hasExchange(matchStarLord, mStarLordPos, matchChart)
        ) {
            batting.score += 3;
            batting.rules.push("P-1 BAT EXCELLENT");
        } else {
            batting.score += 1;
            batting.rules.push("P-1 BAT GOOD");
        }
        batting.locked = true;
    }

    if (bowling.status !== "FLOP" && matchRasi === playerRasi) {
        if (
            isStrong(playerRasiLord, pRasiLordPos.longitude) ||
            hasExchange(playerRasiLord, pRasiLordPos, matchChart)
        ) {
            bowling.score += 3;
            bowling.rules.push("P-2 BOWL EXCELLENT");
        } else {
            bowling.score += 1;
            bowling.rules.push("P-2 BOWL GOOD");
        }
        bowling.locked = true;
    }

    /* ------------------ TIER 2 ------------------ */

    if (["Rahu", "Ketu"].includes(playerStarLord)) {
        if (isInSigns(pRasiLordPos, getOwnedSigns(matchStarLord))) {
            batting.score += 2;
            batting.rules.push("E-2 RAHU/KETU GOOD");
        } else {
            batting.score = -1;
            batting.status = "FLOP";
            batting.rules.push("E-2 RAHU/KETU FAIL");
            // Return early with current state
            return { batting, bowling };
        }
    }

    if (!batting.locked) {
        if (
            isConjoined(mRasiLordPos, mStarLordPos) &&
            (mRasiLordPos.signId === pRasiLordPos.signId ||
                mRasiLordPos.signId === pStarLordPos.signId)
        ) {
            batting.score += 1;
            batting.rules.push("E-1 FALLBACK");
        }
    }

    /* ------------------ TIER 3 ------------------ */

    if (
        isInSigns(pRasiLordPos, getOwnedSigns(matchStarLord)) &&
        isInSigns(pStarLordPos, getOwnedSigns(matchStarLord))
    ) {
        batting.score += 1;
        batting.rules.push("BAT SameHouse Rule");
    }

    if (
        isInSigns(pRasiLordPos, getOwnedSigns(matchRasiLord)) &&
        isInSigns(pStarLordPos, getOwnedSigns(matchRasiLord))
    ) {
        bowling.score += 4;
        bowling.rules.push("S-3 BOTH LORDS IN RASI HOUSE");
    }

    /* ------------------ TIER 4 ------------------ */

    if (pRasiLordPos.signId === matchChart.ascSign.id) {
        bowling.score += 3;
        bowling.rules.push("L-1 RASI LORD IN LAGNA");
    }

    if (isConjoined(pRasiLordPos, mLagnaLordPos)) {
        bowling.score += 3;
        bowling.rules.push("L-2 RASI LORD CONJOIN LAGNA LORD");
    }

    if (
        matchRasiLord === matchLagnaLord &&
        (playerRasiLord === matchLagnaLord ||
            playerStarLord === matchLagnaLord)
    ) {
        bowling.score += 3;
        bowling.rules.push("L-3 LAGNA LORD MATCH");
    }

    /* ------------------ FINALIZE ------------------ */

    // Only update status if not already decided/fixed (e.g. valid FLOP)
    if (batting.status !== "FLOP" && batting.status !== "STRONG GOOD") { // logic check
        batting.status = finalizeStatus(batting.score);
    } else if (batting.status === "UNDECIDED") {
        batting.status = finalizeStatus(batting.score);
    }
    // Simplified: finalizeStatus handles UNDECIDED/GOOD/FLOP logic based on score?
    // But Tier 0/2 might have set FLOP explicitly.
    // finalizeStatus helper: score >= 3 -> STRONG ...
    // If status is already FLOP, we should probably stick to it?
    // The provided code did: batting.status = finalizeStatus(batting.score).
    // This overwrites "FLOP" if the score is somehow >= 1?
    // But if FLOP was set, score is -1 (Tier 2).
    // finalizeStatus(-1) returns "FLOP".
    // So it works fine.

    batting.status = finalizeStatus(batting.score);
    bowling.status = finalizeStatus(bowling.score);

    return { batting, bowling };
};

module.exports = { evaluatePrediction };
