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
        nakLord: nak.lord,
        pada: nak.pada
    };
};

const isConjoined = (a, b) => a && b && a.signId === b.signId;
const isInSigns = (pos, signs) => pos && Array.isArray(signs) && signs.includes(pos.signId);
const getOwnedSigns = (planet) => PLANET_INFO[planet]?.own || [];

const getDignityWrapper = (planet, lng) => calculateDignity(planet, lng);

const isExalted = (planet, lng) => getDignityWrapper(planet, lng).english === 'Exalted';
const isDebilitated = (planet, lng) => getDignityWrapper(planet, lng).english === 'Debilitated';
const isOwnSign = (planet, lng) => getDignityWrapper(planet, lng).english === 'Own Sign';

// Check if all planets in the list are in the same sign
const areInSameSign = (positions) => {
    if (!positions || positions.length < 2) return false;
    const firstSign = positions[0]?.signId;
    if (!firstSign) return false;
    return positions.every(p => p && p.signId === firstSign);
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
        moon: getPlanetPosition("Moon", { planets: pMap }),
        sun: getPlanetPosition("Sun", { planets: pMap }),
        mars: getPlanetPosition("Mars", { planets: pMap }),
        mercury: getPlanetPosition("Mercury", { planets: pMap }),
        jupiter: getPlanetPosition("Jupiter", { planets: pMap }),
        venus: getPlanetPosition("Venus", { planets: pMap }),
        saturn: getPlanetPosition("Saturn", { planets: pMap }),
        rahu: getPlanetPosition("Rahu", { planets: pMap }),
        ketu: getPlanetPosition("Ketu", { planets: pMap })
    };

    if (!playerChart.moon || !matchChart.moon)
        throw new Error("Moon missing. Abort.");

    /* RAHU / KETU STAR LORD OVERRIDES (Match) */
    let matchStar = matchChart.moon.nakshatra;
    let matchStarLord = matchChart.moon.nakLord;
    let matchRasiLord = matchChart.moon.signLord;

    if (matchStarLord === 'Rahu' || matchStarLord === 'Ketu') {
        matchStarLord = matchRasiLord;
        if (matchStar === 'Magha' || matchStar === 'Magam') {
            matchStarLord = 'Mars';
        }
        if (matchStar === 'Ashwini' || matchStar === 'Aswini') {
            matchStarLord = 'Mars';
        }
    }

    /* RAHU / KETU STAR LORD OVERRIDES (Player) */
    let playerStar = playerChart.moon.nakshatra;
    let playerStarLord = playerChart.moon.nakLord;
    let playerRasiLord = playerChart.moon.signLord;

    // Player Rahu/Ketu Rule (General): If star lord is Rahu/Ketu, use Rasi Lord
    if (playerStarLord === 'Rahu' || playerStarLord === 'Ketu') {
        playerStarLord = playerRasiLord;
    }

    const matchLagnaLord = matchChart.ascSign.lord;
    const matchLagnaRasiId = matchChart.ascSign.id;

    /* STATE */
    const batting = { score: 0, rules: [], status: "UNDECIDED", isSpecial: false };
    const bowling = { score: 0, rules: [], status: "UNDECIDED", isSpecial: false };
    let sureFlopBat = false;
    let sureFlopBowl = false;

    const addRule = (name, score, type = 'both', isSpecial = false, nameTamil = '') => {
        const ruleText = `${name} (${score > 0 ? '+' : ''}${score})`;
        const ruleTextTamil = nameTamil ? `${nameTamil} (${score > 0 ? '+' : ''}${score})` : ruleText;
        const ruleObj = { en: ruleText, ta: ruleTextTamil };

        if (type === 'both' || type === 'bat') {
            batting.score += score;
            batting.rules.push(ruleObj);
            if (isSpecial) batting.isSpecial = true;
        }
        if (type === 'both' || type === 'bowl') {
            bowling.score += score;
            bowling.rules.push(ruleObj);
            if (isSpecial) bowling.isSpecial = true;
        }
    };

    const applyBonuses = (planet, baseScore, type = 'both') => {
        // Ensure planet name is lowercase for P lookup
        const planetKey = planet ? planet.toLowerCase() : null;
        if (planetKey && P[planetKey]) {
            if (isExalted(planet, P[planetKey].longitude)) {
                addRule(`${planet} Exalted Bonus`, 4, type, false, `${planet} உச்சம்`);
            } else if (isOwnSign(planet, P[planetKey].longitude)) {
                addRule(`${planet} Own Sign Bonus`, 4, type, false, `${planet} ஆட்சி`);
            }
        }
    };

    const setSureFlop = (name, nameTamil = '', type = 'both') => {
        if (type === 'both' || type === 'bat') sureFlopBat = true;
        if (type === 'both' || type === 'bowl') sureFlopBowl = true;
        addRule(`${name} (SURE FLOP)`, 0, type, true, nameTamil ? `${nameTamil} (SURE FLOP)` : '');
    };

    // Helper to get positions for easier access
    const P = playerChart;

    /* ================= GENERAL BATTING RULES ================= */

    // Rule 1: ZIG-ZAG RULE
    if (matchRasiLord === playerStarLord && matchStarLord === playerRasiLord) {
        addRule('BAT Rule 1: Zig-Zag', 12, 'bat', false, 'பேட்டிங் விதி 1: ஜிக்-ஜாக்');
        applyBonuses(playerRasiLord, 4, 'bat');
    }

    // Rule 2: DIRECT RULE
    if (matchRasiLord === playerRasiLord && matchStarLord === playerStarLord) {
        addRule('BAT Rule 2: Direct', 6, 'bat', false, 'பேட்டிங் விதி 2: நேரடி விதி');
        applyBonuses(playerRasiLord, 4, 'bat');
    }

    // Rule 3: STAR RULE
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        addRule('BAT Rule 3: Star', 4, 'bat', false, 'பேட்டிங் விதி 3: நட்சத்திர விதி');
        applyBonuses(matchStarLord, 4, 'bat');
    }


    // Rule 4: CONJUNCTION RULE (Modified)
    // Match Nakshatra Athipathi joins Player Rasi Athipathi OR Player Nakshatra Athipathi
    // இருக்கும் அதே வீட்டில் (Same House) இணைந்து (Conjunction) இருந்தால்

    // Helper to check conjunction specifically with Match Star Lord in PLAYER CHART
    const isConjoinedWithMatchStarLord = (planetPos) => {
        const matchStarLordPos = P[matchStarLord.toLowerCase()];
        return planetPos && matchStarLordPos && planetPos.signId === matchStarLordPos.signId;
    };

    // Helper for Match Rasi Lord in PLAYER CHART
    const isConjoinedWithMatchRasiLord = (planetPos) => {
        const matchRasiLordPos = P[matchRasiLord.toLowerCase()];
        return planetPos && matchRasiLordPos && planetPos.signId === matchRasiLordPos.signId;
    };


    // PART A: Match Star Lord Conjunction (Positive for Batting)
    // Check Player Rasi Lord
    if (P[playerRasiLord.toLowerCase()] && isConjoinedWithMatchStarLord(P[playerRasiLord.toLowerCase()])) {
        addRule('BAT Rule 4: Conjunction (Rasi Lord)', 4, 'bat', false, 'பேட்டிங் விதி 4: சேர்க்கை விதி (ராசி அதிபதி)');
        applyBonuses(playerRasiLord, 4, 'bat');
        const matchStarLordSignId = P[matchStarLord.toLowerCase()]?.signId;
        if (matchLagnaRasiId === matchStarLordSignId) {
            addRule('BAT Rule 4: Lagna Match', 2, 'bat', false, 'பேட்டிங் விதி 4: மேட்ச் லக்னம் ராசி அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }
    // Check Player Nakshatra Lord
    else if (P[playerStarLord.toLowerCase()] && isConjoinedWithMatchStarLord(P[playerStarLord.toLowerCase()])) {
        addRule('BAT Rule 4: Conjunction (Star Lord)', 4, 'bat', false, 'பேட்டிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
        applyBonuses(playerStarLord, 4, 'bat');
        const matchStarLordSignId = P[matchStarLord.toLowerCase()]?.signId;
        if (matchLagnaRasiId === matchStarLordSignId) {
            addRule('BAT Rule 4: Lagna Match', 2, 'bat', false, 'பேட்டிங் விதி 4: மேட்ச் லக்னம் நட்சத்திர அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }

    // PART B: Match Rasi Lord Conjunction (Batting: 0 Points / Ignored)
    // As per latest update, this condition gives 0 points for Batting, so we do nothing here.


    // Rule 5: SAME HOUSE RULE (Updated)

    // 5A: Match Star Lord (Batting & Bowling: +4 Points)
    const ownedByMatchStarLord = getOwnedSigns(matchStarLord);
    // UPDATED Condition: Player Rasi LORD & Player Star LORD in Match Star Lord's House
    // Note: Previous logic checked P.moon (Rasi). Updated to check Rasi Lord's position.

    // We reuse the positions if calculated before, or fetch them here
    // Note: playerRasiLordPos and playerStarLordPos are defined below in existing code, but best to re-define or ensure scope if moving up
    // Just re-fetching for safety in this block
    const pRasiLordPos = P[playerRasiLord.toLowerCase()];
    const pStarLordPos = P[playerStarLord.toLowerCase()];

    if (
        pRasiLordPos && ownedByMatchStarLord.includes(calculateSign(pRasiLordPos.longitude).id) &&
        pStarLordPos && ownedByMatchStarLord.includes(calculateSign(pStarLordPos.longitude).id)
    ) {
        // Batting
        addRule('BAT Rule 5: Same House (Star Lord)', 4, 'bat', false, 'பேட்டிங் விதி 5: ஒரே ராசி (நட்சத்திர அதிபதி)');
        if (isExalted(playerRasiLord, P.moon.longitude) || isOwnSign(playerRasiLord, P.moon.longitude)) {
            addRule('BAT Rule 5: Bonus', 2, 'bat', false, 'பேட்டிங் விதி 5: போனஸ் (+2)');
        }
        // Bowling
        addRule('BOWL Rule 5: Same House (Star Lord)', 4, 'bowl', false, 'பவுலிங் விதி 5: ஒரே ராசி (நட்சத்திர அதிபதி)');
        if (isExalted(playerRasiLord, P.moon.longitude) || isOwnSign(playerRasiLord, P.moon.longitude)) {
            addRule('BOWL Rule 5: Bonus', 2, 'bowl', false, 'பவுலிங் விதி 5: போனஸ் (+2)');
        }
    }

    // 5B: Match Rasi Lord (Bowling: +6 Points, Batting: SURE FLOP)
    const ownedByMatchRasiLord = getOwnedSigns(matchRasiLord);
    // Condition: Player Rasi & Player Star Lord in Match Rasi Lord's House
    if (
        ownedByMatchRasiLord.includes(P.moon.signId) &&
        P[playerStarLord.toLowerCase()] &&
        ownedByMatchRasiLord.includes(calculateSign(P[playerStarLord.toLowerCase()].longitude).id)
    ) {
        // Batting -> SURE FLOP
        setSureFlop('BAT Rule 5: Match Rasi Same House', 'பேட்டிங் விதி 5: மேட்ச் ராசி அதிபதி வீட்டில் ஒரே ராசி (Sure Flop)');

        // Bowling -> Positive (+6)
        addRule('BOWL Rule 5: Same House (Rasi Lord)', 6, 'bowl', false, 'பவுலிங் விதி 5: மேட்ச் ராசி அதிபதி வீட்டில் ஒரே ராசி (+6)');
        if (isExalted(playerRasiLord, P.moon.longitude) || isOwnSign(playerRasiLord, P.moon.longitude)) {
            addRule('BOWL Rule 5: Bonus', 2, 'bowl', false, 'பவுலிங் விதி 5: போனஸ் (+2)');
        }
    }

    // Rule 6: PLAYER RASI ATHIPATHI HOME
    const matchRasiLordTransit = getPlanetPosition(matchRasiLord, { planets: matchChart.planets });
    if (matchRasiLordTransit && matchRasiLordTransit.signId === P.moon.signId) {
        const matchStarLordTransit = getPlanetPosition(matchStarLord, { planets: matchChart.planets });
        if (matchStarLordTransit && matchStarLordTransit.signId === P.moon.signId) {
            addRule('BAT Rule 6: Player Rasi Home', 6, 'bat', false, 'பேட்டிங் விதி 6: ராசி அதிபதி வீடு');
            applyBonuses(playerRasiLord, 4, 'bat');
        }
    }

    // Rule 7: RAHU/KETU PLAYER RULE
    if (P.moon.nakLord === 'Rahu' || P.moon.nakLord === 'Ketu') {
        const matchStarSigns = getOwnedSigns(matchStarLord);
        if (matchStarSigns.includes(P.moon.signId)) {
            addRule('BAT Rule 7: Rahu/Ketu Player', 4, 'bat', false, 'பேட்டிங் விதி 7: ராகு/கேது விதி');
            applyBonuses(playerRasiLord, 4, 'bat');
        }
    }

    // Rule 8: LAGNA RULE (BATTING)
    if (matchLagnaLord === playerRasiLord) {
        addRule('BAT Rule 8: Lagna', 2, 'bat', false, 'பேட்டிங் விதி 8: லக்ன விதி');
        if (isExalted(playerRasiLord, P.moon.longitude) || isOwnSign(playerRasiLord, P.moon.longitude)) addRule('BAT Rule 8: Bonus', 2, 'bat', false, 'பேட்டிங் விதி 8: போனஸ்');
    }

    // Rule 9: DOUBLE LORD CONJUNCTION – POWER RULE (+12)
    // Match Rasi & Nakshatra Lords Conjunction Rule
    // Condition: Match Rasi Athipathi AND Match Nakshatra Athipathi
    // 👉 Two Planets Conjoined (Inainthu) -> IN PLAYER CHART
    // 👉 In a house owned by Player Rasi Athipathi OR Player Nakshatra Athipathi
    if (matchRasiLord && matchStarLord && playerRasiLord && playerStarLord) {
        // Get Player Lords' Owned Signs
        const pRasiLordSigns = getOwnedSigns(playerRasiLord);
        const pStarLordSigns = getOwnedSigns(playerStarLord);
        const allowedSigns = [...new Set([...pRasiLordSigns, ...pStarLordSigns])]; // Unique IDs

        // Get Positions of Match Lords in PLAYER'S CHART (P) - NOT Match Chart
        const matchRasiLordPosInPlayer = P[matchRasiLord.toLowerCase()];
        const matchStarLordPosInPlayer = P[matchStarLord.toLowerCase()];

        // CHECK 1: Conjunction (Must be in same sign IN PLAYER CHART)
        const isConjoinedInPlayerChart = matchRasiLordPosInPlayer && matchStarLordPosInPlayer &&
            matchRasiLordPosInPlayer.signId === matchStarLordPosInPlayer.signId;

        // CHECK 2: That sign must be in Allowed Signs
        const isInPlayerLordHouse = matchRasiLordPosInPlayer && allowedSigns.includes(matchRasiLordPosInPlayer.signId);

        if (isConjoinedInPlayerChart && isInPlayerLordHouse) {
            addRule('BAT Rule 9: Double Lord Conjunction (Player Chart)', 12, 'bat', true, 'பேட்டிங் விதி 9: மேட்ச் ராசி & நட்சத்திர அதிபதி ஜாதகத்தில் சேர்க்கை (+12)');
            addRule('BOWL Rule 9: Double Lord Conjunction (Player Chart)', 12, 'bowl', true, 'பவுலிங் விதி 9: மேட்ச் ராசி & நட்சத்திர அதிபதி ஜாதகத்தில் சேர்க்கை (+12)');
        }
    }

    /* ================= GENERAL BOWLING RULES ================= */

    // BOWL Rule 1: ZIG-ZAG
    if (matchRasiLord === playerStarLord && matchStarLord === playerRasiLord) {
        addRule('BOWL Rule 1: Zig-Zag', 12, 'bowl', false, 'பவுலிங் விதி 1: ஜிக்-ஜாக்');
        applyBonuses(playerRasiLord, 4, 'bowl');
    }

    // BOWL Rule 2: DIRECT (NEGATIVE)
    // BOWL Rule 2: DIRECT (NEGATIVE)
    if (matchRasiLord === playerRasiLord && matchStarLord === playerStarLord) {
        setSureFlop('BOWL Rule 2: Same Rasi & Star', 'பவுலிங் விதி 2: ஒரே ராசி & நட்சத்திரம்', 'bowl');
    }

    // BOWL Rule 3: STAR RULE
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        addRule('BOWL Rule 3: Star', 3, 'bowl', false, 'பவுலிங் விதி 3: நட்சத்திர விதி');
        if (P[matchStarLord.toLowerCase()] && (isExalted(matchStarLord, P[matchStarLord.toLowerCase()].longitude) || isOwnSign(matchStarLord, P[matchStarLord.toLowerCase()].longitude))) addRule('BOWL Rule 3: Bonus', 6, 'bowl', false, 'பவுலிங் விதி 3: போனஸ்');
    }


    // BOWL Rule 4: CONJUNCTION (Modified)
    // Same logic as Batting
    // Helper for Bowling Conjunction (Match Star Lord)
    const isConjoinedWithMatchStarLordBowl = (planetPos) => {
        const matchStarLordPos = P[matchStarLord.toLowerCase()];
        return planetPos && matchStarLordPos && planetPos.signId === matchStarLordPos.signId;
    };

    // Helper for Bowling Conjunction (Match Rasi Lord)
    const isConjoinedWithMatchRasiLordBowl = (planetPos) => {
        const matchRasiLordPos = P[matchRasiLord.toLowerCase()];
        return planetPos && matchRasiLordPos && planetPos.signId === matchRasiLordPos.signId;
    };

    // PART A: Match Star Lord (Bowling Positive)
    if (P[playerRasiLord.toLowerCase()] && isConjoinedWithMatchStarLordBowl(P[playerRasiLord.toLowerCase()])) {
        addRule('BOWL Rule 4: Conjunction Star (Rasi Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
        applyBonuses(playerRasiLord, 4, 'bowl');
        if (matchLagnaRasiId === P[matchStarLord.toLowerCase()]?.signId) {
            addRule('BOWL Rule 4: Lagna Match', 2, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் லக்னம் நட்சத்திர அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }
    else if (P[playerStarLord.toLowerCase()] && isConjoinedWithMatchStarLordBowl(P[playerStarLord.toLowerCase()])) {
        addRule('BOWL Rule 4: Conjunction Star (Star Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
        applyBonuses(playerStarLord, 4, 'bowl');
        if (matchLagnaRasiId === P[matchStarLord.toLowerCase()]?.signId) {
            addRule('BOWL Rule 4: Lagna Match', 2, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் லக்னம் நட்சத்திர அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }

    // PART B: Match Rasi Lord (Bowling Positive)
    if (P[playerRasiLord.toLowerCase()] && isConjoinedWithMatchRasiLordBowl(P[playerRasiLord.toLowerCase()])) {
        addRule('BOWL Rule 4: Conjunction Rasi (Rasi Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் ராசி அதிபதி சேர்க்கை');
        applyBonuses(playerRasiLord, 4, 'bowl');
        if (matchLagnaRasiId === P[matchRasiLord.toLowerCase()]?.signId) {
            addRule('BOWL Rule 4: Lagna Match (Rasi)', 2, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் லக்னம் ராசி அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }
    else if (P[playerStarLord.toLowerCase()] && isConjoinedWithMatchRasiLordBowl(P[playerStarLord.toLowerCase()])) {
        addRule('BOWL Rule 4: Conjunction Rasi (Star Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் ராசி அதிபதி சேர்க்கை');
        applyBonuses(playerStarLord, 4, 'bowl');
        if (matchLagnaRasiId === P[matchRasiLord.toLowerCase()]?.signId) {
            addRule('BOWL Rule 4: Lagna Match (Rasi)', 2, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் லக்னம் ராசி அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }

    // BOWL Rule 5: SAME HOUSE
    const ownedByMatchLords = [...getOwnedSigns(matchRasiLord), ...getOwnedSigns(matchStarLord)];
    if (ownedByMatchLords.includes(P.moon.signId) && P[playerStarLord.toLowerCase()] && ownedByMatchLords.includes(calculateSign(P[playerStarLord.toLowerCase()].longitude).id)) {
        addRule('BOWL Rule 5: Same House', 4, 'bowl', false, 'பவுலிங் விதி 5: ஒரே ராசி');
        if (isExalted(playerRasiLord, P.moon.longitude) || isOwnSign(playerRasiLord, P.moon.longitude)) addRule('BOWL Rule 5: Bonus', 2, 'bowl', false, 'பவுலிங் விதி 5: போனஸ்');
    }

    // BOWL Rule 6: PLAYER RASI HOME
    const matchRasiLordT = getPlanetPosition(matchRasiLord, { planets: matchChart.planets });
    const matchStarLordT = getPlanetPosition(matchStarLord, { planets: matchChart.planets });
    if (matchRasiLordT && matchStarLordT && matchRasiLordT.signId === P.moon.signId && matchStarLordT.signId === P.moon.signId) {
        addRule('BOWL Rule 6: Player Rasi Home', 4, 'bowl', false, 'பவுலிங் விதி 6: ராசி அதிபதி வீடு');
        if (isExalted(playerRasiLord, P.moon.longitude) || isOwnSign(playerRasiLord, P.moon.longitude)) addRule('BOWL Rule 6: Bonus', 2, 'bowl', false, 'பவுலிங் விதி 6: போனஸ்');
    }

    // BOWL Rule 7: RAHU/KETU RULE
    if (P.moon.nakLord === 'Rahu' || P.moon.nakLord === 'Ketu') {
        const matchStarSigns = getOwnedSigns(matchStarLord);
        if (matchStarSigns.includes(P.moon.signId)) {
            addRule('BOWL Rule 7: Rahu/Ketu', 4, 'bowl', false, 'பவுலிங் விதி 7: ராகு/கேது விதி');
            applyBonuses(playerRasiLord, 4, 'bowl');
        }
    }

    // BOWL Rule 8: LAGNA RULE
    if (matchLagnaLord === playerRasiLord) {
        addRule('BOWL Rule 8: Lagna', 4, 'bowl', false, 'பவுலிங் விதி 8: லக்ன விதி');
        applyBonuses(playerRasiLord, 4, 'bowl');
        const planetsInLagna = Object.keys(playerChart.planets).filter(p => {
            const planetPos = playerChart.planets[p];
            return typeof planetPos === 'number' && calculateSign(planetPos).id === matchLagnaRasiId;
        });
        if (planetsInLagna.some(p => isExalted(p, playerChart.planets[p]) || isOwnSign(p, playerChart.planets[p]))) {
            addRule('BOWL Rule 8: Planet Bonus', 4, 'bowl', false, 'பவுலிங் விதி 8: கிரக போனஸ்');
        }
    }

    // BOWL Rule 9: MATCH SIGN LORD RULE
    if (matchRasiLord === playerRasiLord) {
        addRule('BOWL Rule 9: Match Sign Lord', 3, 'bowl', false, 'பவுலிங் விதி 9: ராசி அதிபதி விதி');
        if (isExalted(playerRasiLord, P.moon.longitude) || isOwnSign(playerRasiLord, P.moon.longitude)) addRule('BOWL Rule 9: Bonus', 8, 'bowl', false, 'பவுலிங் விதி 9: போனஸ்');
    }

    /* ================= MATCH STAR SPECIFIC RULES (Legacy/Additional) ================= */

    switch (matchStar) {
        // 1. ASWINI
        case 'Ashwini':
        case 'Aswini':
            if (isExalted('Mars', P.mars.longitude)) addRule('Aswini: Mars Exalted', 8, 'both', false, 'அசுவினி: செவ்வாய் உச்சம்');
            else if (isDebilitated('Mars', P.mars.longitude)) addRule('Aswini: Mars Debilitated', -12, 'both', false, 'அசுவினி: செவ்வாய் நீசம்');
            if (isConjoined(P.mars, P.venus)) addRule('Aswini: Mars + Venus Conjunction', 10, 'both', false, 'அசுவினி: செவ்வாய் + சுக்கிரன் சேர்க்கை');
            break;

        // 2. BHARANI
        case 'Bharani':
            {
                const isVenusOrMercuryLord = ['Venus', 'Mercury'].includes(playerRasiLord) || ['Venus', 'Mercury'].includes(playerStarLord);
                if (isVenusOrMercuryLord && isConjoined(P.venus, P.mercury)) {
                    setSureFlop('Bharani: Venus + Mercury Conjunction (Batting Sure Flop)', 'பரணி: சுக்கிரன் + புதன் சேர்க்கை (பேட்டிங் வீழ்ச்சி)', 'bat');
                    addRule('Bharani: Venus + Mercury Conjunction (+12)', 12, 'bowl', true, 'பரணி: சுக்கிரன் + புதன் சேர்க்கை (+12)');
                }
            }
            break;

        // 3. ROHINI
        case 'Rohini':
            if (isDebilitated('Moon', P.moon.longitude)) addRule('Rohini: Moon Debilitated', 8, 'both', false, 'ரோகிணி: சந்திரன் நீசம்');
            if ((playerStar === 'Shatabhisha' || playerStar === 'Sathayam') && isConjoined(P.saturn, P.rahu)) {
                addRule('Rohini: Player Sathayam & Saturn+Rahu Conjunction', 12, 'both', true, 'ரோகிணி: சதயம் நட்சத்திரம் & சனி+ராகு சேர்க்கை');
            }
            break;

        // 4. THIRUVATHIRAI
        case 'Ardra':
        case 'Thiruvathirai':
            if (playerRasiLord === 'Mars' || playerStarLord === 'Mars') addRule('Thiruvathirai: Mars Rasi/Star Lord', 4, 'both', false, 'திருவாதிரை: செவ்வாய் ராசி/நட்சத்திர அதிபதி');
            if (isOwnSign('Mars', P.mars.longitude) || isExalted('Mars', P.mars.longitude)) addRule('Thiruvathirai: Mars Own/Exalted', 10, 'both', false, 'திருவாதிரை: செவ்வாய் ஆட்சி/உச்சம்');
            break;

        // 5. AYILYAM
        case 'Ashlesha':
        case 'Ayilyam':
            {
                const isVenusOrMercuryLord = ['Venus', 'Mercury'].includes(playerRasiLord) || ['Venus', 'Mercury'].includes(playerStarLord);
                if (isVenusOrMercuryLord && isConjoined(P.venus, P.mercury)) {
                    setSureFlop('Ayilyam: Venus + Mercury Conjunction (Batting Sure Flop)', 'ஆயில்யம்: சுக்கிரன் + புதன் சேர்க்கை (பேட்டிங் வீழ்ச்சி)', 'bat');
                    addRule('Ayilyam: Venus + Mercury Conjunction (+12)', 12, 'bowl', true, 'ஆயில்யம்: சுக்கிரன் + புதன் சேர்க்கை (+12)');
                }
            }
            break;

        // 6. MAGAM
        case 'Magha':
        case 'Magam':
            if (playerRasiLord === 'Mercury' && playerStarLord === 'Mars') addRule('Magam: Rasi Lord Mercury & Star Lord Mars (+12) 👉 Show Special Player', 12, 'both', true, 'மகம்: ராசி அதிபதி புதன் & நட்சத்திர அதிபதி செவ்வாய் (+12) 👉 சிறப்பு வீரர்');
            break;

        // 7. POORAM
        case 'Purva Phalguni':
        case 'Pooram':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Pooram: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true, 'பூரம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி செவ்வாய்');
            if (playerRasiLord === 'Jupiter' && playerStarLord === 'Mercury') addRule('Pooram: Rasi Lord Jupiter & Star Lord Mercury', 12, 'bowl', true, 'பூரம்: ராசி அதிபதி குரு & நட்சத்திர அதிபதி புதன்');
            break;

        // 8. UTHIRAM (Virgo)
        case 'Uttara Phalguni':
        case 'Uthiram':
            if (matchChart.moon.signId === 6) { // Virgo
                if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Uthiram (Kanya): Rasi Lord Saturn & Star Lord Rahu (+12) 👉 Show Special Player', 12, 'both', true, 'உத்திரம் (கன்னி): ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு (+12) 👉 சிறப்பு வீரர்');
            }
            break;

        // 9. CHITHIRAI
        case 'Chitra':
        case 'Chithirai':
            if (matchChart.moon.signId === 6) { // Padas 1,2
                if (playerRasiLord === 'Mercury' && isConjoined(P.mercury, P.sun)) {
                    if (areInSameSign([P.mercury, P.sun, P.venus, P.jupiter])) addRule('Chithirai (Virgo): Merc+Sun+Ven+Jup', 12, 'both', false, 'சித்திரை (கன்னி): புதன்+சூரியன்+சுக்கிரன்+குரு');
                    else if (areInSameSign([P.mercury, P.sun, P.jupiter])) addRule('Chithirai (Virgo): Merc+Sun+Jup', 8, 'both', false, 'சித்திரை (கன்னி): புதன்+சூரியன்+குரு');
                    else addRule('Chithirai (Virgo): Merc+Sun', 6, 'both', false, 'சித்திரை (கன்னி): புதன்+சூரியன்');
                }
            } else if (matchChart.moon.signId === 7) { // Padas 3,4
                if (playerRasiLord === 'Moon' && playerStarLord === 'Saturn') addRule('Chithirai (Libra): Rasi Lord Moon & Star Lord Saturn (+12) ⭐ Show SPECIAL PLAYER', 12, 'both', true, 'சித்திரை (துலாம்): ராசி அதிபதி சந்திரன் & நட்சத்திர அதிபதி சனி (+12) ⭐ சிறப்பு வீரர்');
            }
            break;

        // 10. ANUSHAM
        case 'Anuradha':
        case 'Anusham':
            if (playerRasiLord === 'Jupiter') {
                addRule('Anusham: Rasi Lord Jupiter', 5, 'both', false, 'அனுஷம்: ராசி அதிபதி குரு');
                if (isOwnSign('Jupiter', P.jupiter.longitude) || isExalted('Jupiter', P.jupiter.longitude)) addRule('Anusham: Jupiter Own/Exalted', 10, 'both', false, 'அனுஷம்: குரு ஆட்சி/உச்சம்');
            }
            break;

        // 11. KETTAI
        case 'Jyeshtha':
        case 'Kettai':
            {
                const isVenusOrMercuryLord = ['Venus', 'Mercury'].includes(playerRasiLord) || ['Venus', 'Mercury'].includes(playerStarLord);
                if (isVenusOrMercuryLord && isConjoined(P.mercury, P.venus)) {
                    setSureFlop('Kettai: Mercury + Venus Conjunction (Batting Sure Flop)', 'கேட்டை: புதன் + சுக்கிரன் சேர்க்கை (பேட்டிங் வீழ்ச்சி)', 'bat');
                    addRule('Kettai: Mercury + Venus Conjunction (+12)', 12, 'bowl', true, 'கேட்டை: புதன் + சுக்கிரன் சேர்க்கை (+12)');
                }
            }
            break;

        // 12. MOOLAM
        case 'Mula':
        case 'Moolam':
            // Case 1: Batting Special
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') {
                addRule('Moolam: Rasi Lord Saturn & Star Lord Mars (Batting) (+12) 👉 Show Special Player', 12, 'bat', true, 'மூலம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி செவ்வாய் (பேட்டிங்) (+12) 👉 சிறப்பு வீரர்');
            }
            // Case 2: Bowling Special
            else if (playerRasiLord === 'Mars' && playerStarLord === 'Saturn') {
                addRule('Moolam: Rasi Lord Mars & Star Lord Saturn (Bowling) (+12) 👉 Show Special Player', 12, 'bowl', true, 'மூலம்: ராசி அதிபதி செவ்வாய் & நட்சத்திர அதிபதி சனி (பவுலிங்) (+12) 👉 சிறப்பு வீரர்');
            }
            // Case 3: Neutral/Partial Case (NEW CHANGE)
            else if (playerRasiLord === 'Mars') {
                addRule('Moolam: Rasi Lord Mars (Batting 0)', 0, 'bat', false, 'மூலம்: ராசி அதிபதி செவ்வாய் (பேட்டிங் 0)');
                addRule('Moolam: Rasi Lord Mars (Bowling) (+4)', 4, 'bowl', true, 'மூலம்: ராசி அதிபதி செவ்வாய் (பவுலிங்) (+4)');

                if (isOwnSign('Mars', P.mars.longitude) || isExalted('Mars', P.mars.longitude)) {
                    addRule('Moolam: Mars Ucham/Aatchi Bonus (+6)', 6, 'bowl', true, 'மூலம்: செவ்வாய் உச்சம்/ஆட்சி போனஸ் (+6)');
                }
            }
            break;

        // 13. POORADAM
        case 'Purva Ashadha':
        case 'Pooradam':
            // "Pooradam Match-ku OVERRIDE RULE"
            // Note: Server uses `isConjoined` helper.
            // Check if Venus and Mercury are conjoined in PLAYER chart or MATCH chart?
            // "Sukkiran (Venus) & Puthan (Mercury) Ore veetil (Same House) inainthu irunthaal"
            // Usually match-specific rules refer to current match planetary positions unless specified "Player Rasi Athipathi...".
            // However, previous logic `isConjoined(P.venus, P.mercury)` checked PLAYER chart.
            // Requirement doesn't explicitly say "Transit". But commonly "Match Lords" rules might refer to transit or match lords state.
            // Context: "Match in Pooradam ... Sukkiran & Puthan Same House".
            // Since it was `isConjoined(P.venus, P.mercury)` aka Player chart before, I will stick to that interpretation OR
            // check if it meant Transit chart.
            // Wait - "Sure Flop (Batting)" usually applies to prediction for that player. If it's a general day property (Transit), it would apply to EVERYONE.
            // But if it's "Override Rule", it might be general.
            // Let's stick to existing interpretation: Player's Venus/Mercury.
            // Actually, wait. "Match in Pooradam ... Match Lords: Guru – Sukkiran".
            // Sukkiran is Nakshatra Lord. Puthan is Mercury.
            // If it implies Match Day Conjunction, it's a global rule for the day.
            // If it implies Player's Natal Chart, it's player specific.
            // Given "Batting -12" (Player Score), it's likely Player specific or interaction.
            // OLD CODE: `isConjoined(P.venus, P.mercury)` -> Player Chart.
            // I will MODIFY this to implement the split Batting/Bowling logic.

            // Rule: Player Rasi/Star Lord is Venus OR Mercury AND Venus+Mercury Conjoined -> Bat Flop / Bowl Special
            const isVenusOrMercuryLord = ['Venus', 'Mercury'].includes(playerRasiLord) || ['Venus', 'Mercury'].includes(playerStarLord);

            if (isVenusOrMercuryLord && isConjoined(P.venus, P.mercury)) {
                // Batting Sure Flop (-12)
                setSureFlop('Pooradam: Venus + Mercury Conjunction (Batting Sure Flop)', 'பூராடம்: சுக்கிரன் + புதன் சேர்க்கை (பேட்டிங் வீழ்ச்சி)', 'bat');

                // Bowling +12 & Special
                addRule('Pooradam: Venus + Mercury Conjunction (Bowling) (+12)', 12, 'bowl', true, 'பூராடம்: சுக்கிரன் + புதன் சேர்க்கை (பவுலிங்) (+12)');
            }
            break;

        // 14. UTHIRADAM
        case 'Uttara Ashadha':
        case 'Uthiradam':
            if (matchChart.moon.signId === 10) { // Capricorn
                if (playerRasiLord === 'Moon') addRule('Uthiradam (Makara): Rasi Lord Moon (+12) 👉 Show Special Player', 12, 'both', true, 'உத்திராடம் (மகரம்): ராசி அதிபதி சந்திரன் (+12) 👉 சிறப்பு வீரர்');
            }
            break;

        // 15. THIRUVONAM
        case 'Shravana':
        case 'Thiruvonam':
            if (playerRasiLord === 'Mars' && P.mars.signId === 4) addRule('Thiruvonam: Mars in Moon House (Bowling) (+6)', 6, 'bowl', false, 'திருவோணம்: செவ்வாய் சந்திரன் வீட்டில் (பவுலிங்) (+6)');
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Thiruvonam: Rasi Lord Saturn & Star Lord Rahu (+12) 👉 Show Special Player', 12, 'both', true, 'திருவோணம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு (+12) 👉 சிறப்பு வீரர்');
            break;

        // 16. AVITTAM
        case 'Dhanishta':
        case 'Avittam':
            if (matchChart.moon.signId === 10 && playerRasiLord === 'Saturn') addRule('Avittam (Capricorn): Rasi Lord Saturn', 4, 'both', false, 'அவிட்டம் (மகரம்): ராசி அதிபதி சனி');
            break;

        // 17. SATHAYAM
        case 'Shatabhisha':
        case 'Sathayam':
            // Rule: Moon + Jupiter Conjunction in Moon House (Cancer/4) -> SURE FLOP
            if (isConjoined(P.moon, P.jupiter) && P.moon.signId === 4) {
                setSureFlop('Sathayam: Moon + Jupiter in Cancer', 'சதயம்: சந்திரன் + குரு கடகத்தில் சேர்க்கை', 'both');
            }
            // Rule: Rasi Lord Moon -> Game Changer (+12)
            else if (playerRasiLord === 'Moon') {
                addRule('Sathayam: Rasi Lord Moon (+12) 👉 GAME CHANGER 👉 Must Show Special Player', 12, 'both', true, 'சதயம்: ராசி அதிபதி சந்திரன் (+12) 👉 கேம் சேஞ்சர் 👉 சிறப்பு வீரர்');
            }
            break;
    }

    /* GLOBAL NEGATIVE OVERRIDE */
    if (sureFlopBat) {
        batting.score = 0;
        batting.status = "SURE FLOP";
    }
    if (sureFlopBowl) {
        bowling.score = 0;
        bowling.status = "SURE FLOP";
    }

    /* ================= FINAL OUTPUT ================= */
    const netScore = batting.score + bowling.score;

    return {
        batting,
        bowling,
        netScore
    };
};

module.exports = { evaluatePrediction };
