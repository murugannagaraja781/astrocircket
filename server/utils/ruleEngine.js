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
    let globalNegative = false;

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

    const setSureFlop = (name, nameTamil = '') => {
        globalNegative = true;
        addRule(`${name} (SURE FLOP)`, 0, 'both', true, nameTamil ? `${nameTamil} (Sure Flop)` : '');
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

    // Rule 4: CONJUNCTION RULE
    if (P[matchStarLord.toLowerCase()] && P[playerRasiLord.toLowerCase()] && isConjoined(P[matchStarLord.toLowerCase()], P[playerRasiLord.toLowerCase()])) {
        addRule('BAT Rule 4: Conjunction', 4, 'bat', false, 'பேட்டிங் விதி 4: சேர்க்கை விதி');
        applyBonuses(playerRasiLord, 4, 'bat');
        if (matchLagnaRasiId === P.moon.signId) addRule('BAT Rule 4: Lagna Match', 2, 'bat', false, 'பேட்டிங் விதி 4: லக்ன பொருத்தம்');
    }

    // Rule 5: SAME HOUSE RULE
    const ownedByMatchStarLord = getOwnedSigns(matchStarLord);
    if (ownedByMatchStarLord.includes(P.moon.signId) && P[playerStarLord.toLowerCase()] && ownedByMatchStarLord.includes(calculateSign(P[playerStarLord.toLowerCase()].longitude).id)) {
        addRule('BAT Rule 5: Same House', 4, 'bat', false, 'பேட்டிங் விதி 5: ஒரே ராசி');
        if (isExalted(playerRasiLord, P.moon.longitude) || isOwnSign(playerRasiLord, P.moon.longitude)) addRule('BAT Rule 5: Bonus', 2, 'bat', false, 'பேட்டிங் விதி 5: போனஸ்');
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

    /* ================= GENERAL BOWLING RULES ================= */

    // BOWL Rule 1: ZIG-ZAG
    if (matchRasiLord === playerStarLord && matchStarLord === playerRasiLord) {
        addRule('BOWL Rule 1: Zig-Zag', 12, 'bowl', false, 'பவுலிங் விதி 1: ஜிக்-ஜாக்');
        applyBonuses(playerRasiLord, 4, 'bowl');
    }

    // BOWL Rule 2: DIRECT (NEGATIVE)
    if (matchRasiLord === playerRasiLord && matchStarLord === playerStarLord) {
        addRule('BOWL Rule 2: Direct (Negative)', -12, 'bowl', false, 'பவுலிங் விதி 2: நேரடி விதி (எதிர்மறை)');
    }

    // BOWL Rule 3: STAR RULE
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        addRule('BOWL Rule 3: Star', 3, 'bowl', false, 'பவுலிங் விதி 3: நட்சத்திர விதி');
        if (P[matchStarLord.toLowerCase()] && (isExalted(matchStarLord, P[matchStarLord.toLowerCase()].longitude) || isOwnSign(matchStarLord, P[matchStarLord.toLowerCase()].longitude))) addRule('BOWL Rule 3: Bonus', 6, 'bowl', false, 'பவுலிங் விதி 3: போனஸ்');
    }

    // BOWL Rule 4: CONJUNCTION
    const playerRasiLordSignSigns = getOwnedSigns(playerRasiLord);
    const matchStarLordTransit = getPlanetPosition(matchStarLord, { planets: matchChart.planets });
    if (matchStarLordTransit && playerRasiLordSignSigns.includes(matchStarLordTransit.signId)) {
        addRule('BOWL Rule 4: Conjunction', 4, 'bowl', false, 'பவுலிங் விதி 4: சேர்க்கை விதி');
        applyBonuses(playerRasiLord, 4, 'bowl');
        if (matchLagnaRasiId === matchStarLordTransit.signId) addRule('BOWL Rule 4: Lagna Match', 2, 'bowl', false, 'பவுலிங் விதி 4: லக்ன பொருத்தம்');
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
            if (isConjoined(P.venus, P.mercury)) setSureFlop('Bharani: Venus + Mercury Conjunction', 'பரணி: சுக்கிரன் + புதன் சேர்க்கை');
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
            if (isConjoined(P.venus, P.mercury)) setSureFlop('Ayilyam: Venus + Mercury Conjunction', 'ஆயில்யம்: சுக்கிரன் + புதன் சேர்க்கை');
            break;

        // 6. MAGAM
        case 'Magha':
        case 'Magam':
            if (playerRasiLord === 'Mercury' && playerStarLord === 'Mars') addRule('Magam: Rasi Lord Mercury & Star Lord Mars', 12, 'both', true, 'மகம்: ராசி அதிபதி புதன் & நட்சத்திர அதிபதி செவ்வாய்');
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
                if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Uthiram (Kanya): Rasi Lord Saturn & Star Lord Rahu', 12, 'both', true, 'உத்திரம் (கன்னி): ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு');
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
                if (playerRasiLord === 'Moon' && playerStarLord === 'Saturn') addRule('Chithirai (Libra): Rasi Lord Moon & Star Lord Saturn', 12, 'both', true, 'சித்திரை (துலாம்): ராசி அதிபதி சந்திரன் & நட்சத்திர அதிபதி சனி');
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
            if (isConjoined(P.mercury, P.venus)) addRule('Kettai: Mercury + Venus Conjunction', -12, 'both', false, 'கேட்டை: புதன் + சுக்கிரன் சேர்க்கை');
            break;

        // 12. MOOLAM
        case 'Mula':
        case 'Moolam':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Moolam: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true, 'மூலம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி செவ்வாய்');
            if (playerRasiLord === 'Mars' && playerStarLord === 'Saturn') addRule('Moolam: Rasi Lord Mars & Star Lord Saturn', 12, 'bowl', true, 'மூலம்: ராசி அதிபதி செவ்வாய் & நட்சத்திர அதிபதி சனி');
            break;

        // 13. POORADAM
        case 'Purva Ashadha':
        case 'Pooradam':
            if (isConjoined(P.venus, P.mercury)) setSureFlop('Pooradam: Venus + Mercury Conjunction', 'பூராடம்: சுக்கிரன் + புதன் சேர்க்கை');
            break;

        // 14. UTHIRADAM
        case 'Uttara Ashadha':
        case 'Uthiradam':
            if (matchChart.moon.signId === 10) { // Capricorn
                if (playerRasiLord === 'Moon') addRule('Uthiradam (Capricorn): Rasi Lord Moon', 12, 'both', true, 'உத்திராடம் (மகரம்): ராசி அதிபதி சந்திரன்');
            }
            break;

        // 15. THIRUVONAM
        case 'Shravana':
        case 'Thiruvonam':
            if (playerRasiLord === 'Mars' && P.mars.signId === 4) addRule('Thiruvonam: Mars in Moon House', 6, 'bowl', false, 'திருவோணம்: செவ்வாய் சந்திரன் வீட்டில்');
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Thiruvonam: Rasi Lord Saturn & Star Lord Rahu', 12, 'both', true, 'திருவோணம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு');
            break;

        // 16. AVITTAM
        case 'Dhanishta':
        case 'Avittam':
            if (matchChart.moon.signId === 10 && playerRasiLord === 'Saturn') addRule('Avittam (Capricorn): Rasi Lord Saturn', 4, 'both', false, 'அவிட்டம் (மகரம்): ராசி அதிபதி சனி');
            break;

        // 17. SATHAYAM
        case 'Shatabhisha':
        case 'Sathayam':
            if (playerRasiLord === 'Moon') addRule('Sathayam: Rasi Lord Moon', 12, 'both', true, 'சதயம்: ராசி அதிபதி சந்திரன்');
            break;
    }

    /* GLOBAL NEGATIVE OVERRIDE */
    if (globalNegative) {
        batting.score = 0;
        bowling.score = 0;
        batting.status = "SURE FLOP";
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
