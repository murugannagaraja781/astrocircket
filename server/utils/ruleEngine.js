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
    // Handle both TitleCase and lowercase input keys from P map
    const pKey = planet;
    // If chart.planets has "Venus", pKey="Venus".
    const lng = chart.planets[pKey];
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
// Ensure planet name is Title Case for PLANET_INFO lookup (e.g. 'venus' -> 'Venus')
const toTitleCase = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
const getOwnedSigns = (planet) => PLANET_INFO[toTitleCase(planet)]?.own || [];

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
        // Ensure standard keys if needed, but assuming input is valid
        pMap[k] = typeof v === "object" ? v.longitude : v;
        // Create lowercase aliases for easier access
        pMap[k.toLowerCase()] = pMap[k];
    }

    // Helper to get planet from Player Map by name (case-insensitive via pMap aliases)
    const getP = (name) => getPlanetPosition(name, { planets: pMap });

    const playerChart = {
        planets: pMap,
        moon: getP("Moon"),
        sun: getP("Sun"),
        mars: getP("Mars"),
        mercury: getP("Mercury"),
        jupiter: getP("Jupiter"),
        venus: getP("Venus"),
        saturn: getP("Saturn"),
        rahu: getP("Rahu"),
        ketu: getP("Ketu")
    };

    // Shortcut for Player Planets
    const P = playerChart;

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
        const planetPos = P[planet.toLowerCase()];
        if (planetPos) { // P[key] gives longitude if accessed directly via pMap, but P.venus gives Object
            // Wait, P is playerChart. P.venus is the Object. P.planets['venus'] is longitude.
            // Let's use getP(planet) styled access or just use P[planet.toLowerCase()] if P was pMap.
            // But P is playerChart object.
            // P.venus, P.mars etc are objects.
            // We need to look up dynamically.
            // P has keys like 'venus', 'mars' etc.
            const posObj = P[planet.toLowerCase()];
            if (posObj) {
                if (isExalted(planet, posObj.longitude)) {
                    addRule(`${planet} Exalted Bonus`, 4, type, false, `${planet} உச்சம்`);
                } else if (isOwnSign(planet, posObj.longitude)) {
                    addRule(`${planet} Own Sign Bonus`, 4, type, false, `${planet} ஆட்சி`);
                }
            }
        }
    };

    const setSureFlop = (name, nameTamil = '', type = 'both') => {
        if (type === 'both' || type === 'bat') sureFlopBat = true;
        if (type === 'both' || type === 'bowl') sureFlopBowl = true;
        addRule(`${name} (SURE FLOP)`, 0, type, true, nameTamil ? `${nameTamil} (SURE FLOP)` : '');
    };


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


    // Rule 4 & 5 Helpers
    const isConjoinedWithMatchStarLord = (planetPos) => {
        const matchStarLordPos = P[matchStarLord.toLowerCase()];
        return isConjoined(planetPos, matchStarLordPos);
    };

    const isConjoinedWithMatchRasiLord = (planetPos) => {
        const matchRasiLordPos = P[matchRasiLord.toLowerCase()];
        return isConjoined(planetPos, matchRasiLordPos);
    };

    // Rule 4: CONJUNCTION RULE (Modified)
    // PART A: Match Star Lord Conjunction (Positive)
    const pRasiLordPos = P[playerRasiLord.toLowerCase()];
    const pStarLordPos = P[playerStarLord.toLowerCase()];

    if (pRasiLordPos && isConjoinedWithMatchStarLord(pRasiLordPos)) {
        addRule('BAT Rule 4: Conjunction (Rasi Lord)', 4, 'bat', false, 'பேட்டிங் விதி 4: சேர்க்கை விதி (ராசி அதிபதி)');
        applyBonuses(playerRasiLord, 4, 'bat');
        const matchStarLordSignId = P[matchStarLord.toLowerCase()]?.signId;
        if (matchLagnaRasiId === matchStarLordSignId) {
            addRule('BAT Rule 4: Lagna Match', 2, 'bat', false, 'பேட்டிங் விதி 4: மேட்ச் லக்னம் ராசி அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }
    else if (pStarLordPos && isConjoinedWithMatchStarLord(pStarLordPos)) {
        addRule('BAT Rule 4: Conjunction (Star Lord)', 4, 'bat', false, 'பேட்டிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
        applyBonuses(playerStarLord, 4, 'bat');
        const matchStarLordSignId = P[matchStarLord.toLowerCase()]?.signId;
        if (matchLagnaRasiId === matchStarLordSignId) {
            addRule('BAT Rule 4: Lagna Match', 2, 'bat', false, 'பேட்டிங் விதி 4: மேட்ச் லக்னம் நட்சத்திர அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }

    // Rule 5: SAME HOUSE RULE (Updated)
    const ownedByMatchStarLord = getOwnedSigns(matchStarLord);

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

    // 5B: Match Rasi Lord
    const ownedByMatchRasiLord = getOwnedSigns(matchRasiLord);
    if (
        ownedByMatchRasiLord.includes(P.moon.signId) &&
        pStarLordPos &&
        ownedByMatchRasiLord.includes(calculateSign(pStarLordPos.longitude).id)
    ) {
        setSureFlop('BAT Rule 5: Match Rasi Same House', 'பேட்டிங் விதி 5: மேட்ச் ராசி அதிபதி வீட்டில் ஒரே ராசி (Sure Flop)');

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
    if (matchRasiLord && matchStarLord && playerRasiLord && playerStarLord) {
        const pRasiLordSigns = getOwnedSigns(playerRasiLord);
        const pStarLordSigns = getOwnedSigns(playerStarLord);
        const allowedSigns = [...new Set([...pRasiLordSigns, ...pStarLordSigns])];

        const matchRasiLordPosInPlayer = P[matchRasiLord.toLowerCase()];
        const matchStarLordPosInPlayer = P[matchStarLord.toLowerCase()];

        const isConjoinedInPlayerChart = matchRasiLordPosInPlayer && matchStarLordPosInPlayer &&
            matchRasiLordPosInPlayer.signId === matchStarLordPosInPlayer.signId;

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
    if (matchRasiLord === playerRasiLord && matchStarLord === playerStarLord) {
        setSureFlop('BOWL Rule 2: Same Rasi & Star', 'பவுலிங் விதி 2: ஒரே ராசி & நட்சத்திரம்', 'bowl');
    }

    // BOWL Rule 3: STAR RULE
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        addRule('BOWL Rule 3: Star', 3, 'bowl', false, 'பவுலிங் விதி 3: நட்சத்திர விதி');
        if (P[matchStarLord.toLowerCase()] && (isExalted(matchStarLord, P[matchStarLord.toLowerCase()].longitude) || isOwnSign(matchStarLord, P[matchStarLord.toLowerCase()].longitude))) addRule('BOWL Rule 3: Bonus', 6, 'bowl', false, 'பவுலிங் விதி 3: போனஸ்');
    }

    // BOWL Rule 4: CONJUNCTION
    if (pRasiLordPos && isConjoinedWithMatchStarLord(pRasiLordPos)) {
        addRule('BOWL Rule 4: Conjunction Star (Rasi Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
        applyBonuses(playerRasiLord, 4, 'bowl');
        if (matchLagnaRasiId === P[matchStarLord.toLowerCase()]?.signId) {
            addRule('BOWL Rule 4: Lagna Match', 2, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் லக்னம் நட்சத்திர அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }
    else if (pStarLordPos && isConjoinedWithMatchStarLord(pStarLordPos)) {
        addRule('BOWL Rule 4: Conjunction Star (Star Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
        applyBonuses(playerStarLord, 4, 'bowl');
        if (matchLagnaRasiId === P[matchStarLord.toLowerCase()]?.signId) {
            addRule('BOWL Rule 4: Lagna Match', 2, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் லக்னம் நட்சத்திர அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }

    // PART B: Match Rasi Lord
    if (pRasiLordPos && isConjoinedWithMatchRasiLord(pRasiLordPos)) {
        addRule('BOWL Rule 4: Conjunction Rasi (Rasi Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் ராசி அதிபதி சேர்க்கை');
        applyBonuses(playerRasiLord, 4, 'bowl');
        if (matchLagnaRasiId === P[matchRasiLord.toLowerCase()]?.signId) {
            addRule('BOWL Rule 4: Lagna Match (Rasi)', 2, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் லக்னம் ராசி அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }
    else if (pStarLordPos && isConjoinedWithMatchRasiLord(pStarLordPos)) {
        addRule('BOWL Rule 4: Conjunction Rasi (Star Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் ராசி அதிபதி சேர்க்கை');
        applyBonuses(playerStarLord, 4, 'bowl');
        if (matchLagnaRasiId === P[matchRasiLord.toLowerCase()]?.signId) {
            addRule('BOWL Rule 4: Lagna Match (Rasi)', 2, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் லக்னம் ராசி அதிபதி இருக்கும் வீட்டில் இருந்தால் (+2)');
        }
    }

    // BOWL Rule 5: SAME HOUSE
    const ownedByMatchLords = [...getOwnedSigns(matchRasiLord), ...getOwnedSigns(matchStarLord)];
    if (ownedByMatchLords.includes(P.moon.signId) && pStarLordPos && ownedByMatchLords.includes(calculateSign(pStarLordPos.longitude).id)) {
        addRule('BOWL Rule 5: Same House', 4, 'bowl', false, 'பவுலிங் விதி 5: ஒரே ராசி');
        if (isExalted(playerRasiLord, P.moon.longitude) || isOwnSign(playerRasiLord, P.moon.longitude)) addRule('BOWL Rule 5: Bonus', 2, 'bowl', false, 'பவுலிங் விதி 5: போனஸ்');
    }

    // BOWL Rule 6: PLAYER RASI HOME
    const matchRasiLordT2 = getPlanetPosition(matchRasiLord, { planets: matchChart.planets });
    const matchStarLordT2 = getPlanetPosition(matchStarLord, { planets: matchChart.planets });
    if (matchRasiLordT2 && matchStarLordT2 && matchRasiLordT2.signId === P.moon.signId && matchStarLordT2.signId === P.moon.signId) {
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
            // ensure we check against raw pMap if checking keys
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
        case 'Ashwini':
        case 'Aswini':
            if (isExalted('Mars', P.mars.longitude)) addRule('Aswini: Mars Exalted', 8, 'both', false, 'அசுவினி: செவ்வாய் உச்சம்');
            else if (isDebilitated('Mars', P.mars.longitude)) addRule('Aswini: Mars Debilitated', -12, 'both', false, 'அசுவினி: செவ்வாய் நீசம்');
            if (isConjoined(P.mars, P.venus)) addRule('Aswini: Mars + Venus Conjunction', 10, 'both', false, 'அசுவினி: செவ்வாய் + சுக்கிரன் சேர்க்கை');
            break;

        case 'Bharani':
            {
                const isVenusOrMercuryLord = ['Venus', 'Mercury'].includes(playerRasiLord) || ['Venus', 'Mercury'].includes(playerStarLord);
                if (isVenusOrMercuryLord && isConjoined(P.venus, P.mercury)) {
                    setSureFlop('Bharani: Venus + Mercury Conjunction (Batting Sure Flop)', 'பரணி: சுக்கிரன் + புதன் சேர்க்கை (பேட்டிங் வீழ்ச்சி)', 'bat');
                    addRule('Bharani: Venus + Mercury Conjunction (+12)', 12, 'bowl', true, 'பரணி: சுக்கிரன் + புதன் சேர்க்கை (+12)');
                }
            }
            break;

        case 'Rohini':
            if (isDebilitated('Moon', P.moon.longitude)) addRule('Rohini: Moon Debilitated', 8, 'both', false, 'ரோகிணி: சந்திரன் நீசம்');
            if ((playerStar === 'Shatabhisha' || playerStar === 'Sathayam') && isConjoined(P.saturn, P.rahu)) {
                addRule('Rohini: Player Sathayam & Saturn+Rahu Conjunction', 12, 'both', true, 'ரோகிணி: சதயம் நட்சத்திரம் & சனி+ராகு சேர்க்கை');
            }
            break;

        case 'Ardra':
        case 'Thiruvathirai':
            if (playerRasiLord === 'Mars' || playerStarLord === 'Mars') addRule('Thiruvathirai: Mars Rasi/Star Lord', 4, 'both', false, 'திருவாதிரை: செவ்வாய் ராசி/நட்சத்திர அதிபதி');
            if (isOwnSign('Mars', P.mars.longitude) || isExalted('Mars', P.mars.longitude)) addRule('Thiruvathirai: Mars Own/Exalted', 10, 'both', false, 'திருவாதிரை: செவ்வாய் ஆட்சி/உச்சம்');
            break;

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

        case 'Magha':
        case 'Magam':
            if (playerRasiLord === 'Mercury' && playerStarLord === 'Mars') addRule('Magam: Rasi Lord Mercury & Star Lord Mars (+12) 👉 Show Special Player', 12, 'both', true, 'மகம்: ராசி அதிபதி புதன் & நட்சத்திர அதிபதி செவ்வாய் (+12) 👉 சிறப்பு வீரர்');
            break;

        case 'Purva Phalguni':
        case 'Pooram':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Pooram: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true, 'பூரம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி செவ்வாய்');
            if (playerRasiLord === 'Jupiter' && playerStarLord === 'Mercury') addRule('Pooram: Rasi Lord Jupiter & Star Lord Mercury', 12, 'bowl', true, 'பூரம்: ராசி அதிபதி குரு & நட்சத்திர அதிபதி புதன்');
            break;

        case 'Uttara Phalguni':
        case 'Uthiram':
            if (matchChart.moon.signId === 6) { // Virgo
                if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Uthiram (Kanya): Rasi Lord Saturn & Star Lord Rahu (+12) 👉 Show Special Player', 12, 'both', true, 'உத்திரம் (கன்னி): ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு (+12) 👉 சிறப்பு வீரர்');
            }
            break;

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

        case 'Anuradha':
        case 'Anusham':
            if (playerRasiLord === 'Jupiter') {
                addRule('Anusham: Rasi Lord Jupiter', 5, 'both', false, 'அனுஷம்: ராசி அதிபதி குரு');
                if (isOwnSign('Jupiter', P.jupiter.longitude) || isExalted('Jupiter', P.jupiter.longitude)) addRule('Anusham: Jupiter Own/Exalted', 10, 'both', false, 'அனுஷம்: குரு ஆட்சி/உச்சம்');
            }
            break;

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

        case 'Mula':
        case 'Moolam':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') {
                addRule('Moolam: Rasi Lord Saturn & Star Lord Mars (Batting) (+12) 👉 Show Special Player', 12, 'bat', true, 'மூலம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி செவ்வாய் (பேட்டிங்) (+12) 👉 சிறப்பு வீரர்');
            }
            else if (playerRasiLord === 'Mars' && playerStarLord === 'Saturn') {
                addRule('Moolam: Rasi Lord Mars & Star Lord Saturn (Bowling) (+12) 👉 Show Special Player', 12, 'bowl', true, 'மூலம்: ராசி அதிபதி செவ்வாய் & நட்சத்திர அதிபதி சனி (பவுலிங்) (+12) 👉 சிறப்பு வீரர்');
            }
            else if (playerRasiLord === 'Mars') {
                addRule('Moolam: Rasi Lord Mars (Batting 0)', 0, 'bat', false, 'மூலம்: ராசி அதிபதி செவ்வாய் (பேட்டிங் 0)');
                addRule('Moolam: Rasi Lord Mars (Bowling) (+4)', 4, 'bowl', true, 'மூலம்: ராசி அதிபதி செவ்வாய் (பவுலிங்) (+4)');

                if (isOwnSign('Mars', P.mars.longitude) || isExalted('Mars', P.mars.longitude)) {
                    addRule('Moolam: Mars Ucham/Aatchi Bonus (+6)', 6, 'bowl', true, 'மூலம்: செவ்வாய் உச்சம்/ஆட்சி போனஸ் (+6)');
                }
            }
            break;

        case 'Purva Ashadha':
        case 'Pooradam':
            const isVenusOrMercuryLord = ['Venus', 'Mercury'].includes(playerRasiLord) || ['Venus', 'Mercury'].includes(playerStarLord);
            if (isVenusOrMercuryLord && isConjoined(P.venus, P.mercury)) {
                setSureFlop('Pooradam: Venus + Mercury Conjunction (Batting Sure Flop)', 'பூராடம்: சுக்கிரன் + புதன் சேர்க்கை (பேட்டிங் வீழ்ச்சி)', 'bat');
                addRule('Pooradam: Venus + Mercury Conjunction (Bowling) (+12)', 12, 'bowl', true, 'பூராடம்: சுக்கிரன் + புதன் சேர்க்கை (பவுலிங்) (+12)');
            }
            break;

        case 'Uttara Ashadha':
        case 'Uthiradam':
            if (matchChart.moon.signId === 10) { // Capricorn
                if (playerRasiLord === 'Moon') addRule('Uthiradam (Makara): Rasi Lord Moon (+12) 👉 Show Special Player', 12, 'both', true, 'உத்திராடம் (மகரம்): ராசி அதிபதி சந்திரன் (+12) 👉 சிறப்பு வீரர்');
            }
            break;

        case 'Shravana':
        case 'Thiruvonam':
            if (playerRasiLord === 'Mars' && P.mars.signId === 4) addRule('Thiruvonam: Mars in Moon House (Bowling) (+6)', 6, 'bowl', false, 'திருவோணம்: செவ்வாய் சந்திரன் வீட்டில் (பவுலிங்) (+6)');
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Thiruvonam: Rasi Lord Saturn & Star Lord Rahu (+12) 👉 Show Special Player', 12, 'both', true, 'திருவோணம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு (+12) 👉 சிறப்பு வீரர்');
            break;

        case 'Dhanishta':
        case 'Avittam':
            if (matchChart.moon.signId === 10 && playerRasiLord === 'Saturn') addRule('Avittam (Capricorn): Rasi Lord Saturn', 4, 'both', false, 'அவிட்டம் (மகரம்): ராசி அதிபதி சனி');
            break;

        case 'Shatabhisha':
        case 'Sathayam':
            if (isConjoined(P.moon, P.jupiter) && P.moon.signId === 4) {
                setSureFlop('Sathayam: Moon + Jupiter in Cancer', 'சதயம்: சந்திரன் + குரு கடகத்தில் சேர்க்கை', 'both');
            }
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
