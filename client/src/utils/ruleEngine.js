/**
 * === RULE ENGINE FOR ASTRO CRICKET PREDICTION ===
 * விதி இயந்திரம் - Updated Rules System (Nakshatra Based)
 */

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
    'Rahu': ['Aquarius'], // Simplified
    'Ketu': ['Scorpio']   // Simplified
};

/**
 * Check Dignity
 */
function getDignity(planetName, signName) {
    if (!planetName || !signName) return 'Neutral';
    if (EXALTED_SIGNS[planetName] === signName) return 'Exalted';
    if (DEBILITATED_SIGNS[planetName] === signName) return 'Debilitated';
    if (OWN_SIGNS[planetName]?.includes(signName)) return 'Own Sign';
    return 'Neutral';
}

function isExalted(planetName, signName) { return getDignity(planetName, signName) === 'Exalted'; }
function isDebilitated(planetName, signName) { return getDignity(planetName, signName) === 'Debilitated'; }
function isOwnSign(planetName, signName) { return getDignity(planetName, signName) === 'Own Sign'; }

/**
 * Common Prediction Logic
 */
function getPrediction(player, match, transit) {
    const batting = { score: 0, logs: [], isSpecial: false };
    const bowling = { score: 0, logs: [], isSpecial: false };

    if (!player || !match) return { batting, bowling };

    const planetPositions = transit.planetPositions || {}; // Map: Planet -> SignName

    // Helper to get positions specifically for player planets using Player's chart mapped to Transit Signs?
    // Wait, the Server Logic checks Player's Natal Planet positions for Dignity (Exalted in Natal).
    // Client `player` object has `planetPositions` which seems to be Natal positions.
    // Client `transit` object has `planetPositions` which is MATCH DAY positions.

    // Server: `pMap` is Player Birth Chart. `matchChart` is Match Chart.
    // `isExalted('Mars', P.mars.longitude)` -> Checks PLAYER'S Mars.

    const P = player.planetPositions || {}; // Player Natal Positions (Planet Name -> Sign Name)
    const M = transit.planetPositions || {}; // Match Transit Positions (Planet Name -> Sign Name)

    let playerRasiLord = player.rashiLord;
    let playerStarLord = player.nakshatraLord;
    let playerStar = player.nakshatra;

    let matchStar = match.nakshatra; // Name
    let matchRasiLord = match.rashiLord;
    let matchStarLord = match.nakshatraLord;

    /* RAHU / KETU STAR LORD OVERRIDES (Match) per Part 2 */
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
    if (playerStarLord === 'Rahu' || playerStarLord === 'Ketu') {
        playerStarLord = playerRasiLord;
    }

    const matchLagnaLord = transit.ascendantLord; // Assume this is available in transit or derived
    const matchLagnaSign = transit.ascendantSign;

    let globalNegative = false;

    const addRule = (name, score, type = 'both', isSpecial = false, nameTamil = '') => {
        const ruleText = `${name} (${score > 0 ? '+' : ''}${score})`;
        const ruleTextTamil = nameTamil ? `${nameTamil} (${score > 0 ? '+' : ''}${score})` : ruleText;

        const logEntry = { en: ruleText, ta: ruleTextTamil };

        if (type === 'both' || type === 'bat') {
            batting.score += score;
            if (!batting.logs) batting.logs = [];
            batting.logs.push(logEntry);
            if (isSpecial) batting.isSpecial = true;
        }
        if (type === 'both' || type === 'bowl') {
            bowling.score += score;
            if (!bowling.logs) bowling.logs = [];
            bowling.logs.push(logEntry);
            if (isSpecial) bowling.isSpecial = true;
        }
    };

    const applyBonuses = (planet, baseScore, type = 'both') => {
        if (isExalted(planet, P[planet]) || isOwnSign(planet, P[planet])) {
            addRule(`${planet} Aatchi/Ucham Bonus`, 4, type);
        }
    };

    const setSureFlop = (name) => {
        globalNegative = true;
        addRule(`${name} (SURE FLOP)`, 0, 'both', true);
    };

    // Helper for Conjunctions (in Player Chart)
    const areInSameSign = (planets) => {
        if (!planets || planets.length < 2) return false;
        const firstSign = P[planets[0]];
        if (!firstSign) return false;
        return planets.every(p => P[p] === firstSign);
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


    // Rule 4: CONJUNCTION RULE (Modified)
    // Match Nakshatra Athipathi joins Player Rasi Athipathi OR Player Nakshatra Athipathi
    // இருக்கும் அதே வீட்டில் (Same House) இணைந்து (Conjunction) இருந்தால்
    const conjunctionPlanets = [];
    if (P[matchStarLord]) conjunctionPlanets.push(matchStarLord);

    // Check Player Rasi Lord
    if (playerRasiLord && P[playerRasiLord] && P[matchStarLord] && P[matchStarLord] === P[playerRasiLord]) {
        addRule('BAT Rule 4: Conjunction (Rasi Lord)', 4, 'bat', false, 'பேட்டிங் விதி 4: சேர்க்கை விதி (ராசி அதிபதி)');
        applyBonuses(playerRasiLord, 4, 'bat');
        if (matchLagnaSign === player.rashi) addRule('BAT Rule 4: Lagna Match', 2, 'bat', false, 'பேட்டிங் விதி 4: லக்ன பொருத்தம்');
    }
    // Check Player Nakshatra Lord (if not same as Rasi Lord to avoid double counting, or allow double?)
    // Requirement says "OR". Typically handled as finding at least one match.
    else if (playerStarLord && P[playerStarLord] && P[matchStarLord] && P[matchStarLord] === P[playerStarLord]) {
        addRule('BAT Rule 4: Conjunction (Star Lord)', 4, 'bat', false, 'பேட்டிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
        applyBonuses(playerStarLord, 4, 'bat'); // Bonus for the planet involved? Requirement says "அந்த கிரகம் Aatchi / Ucham ஆக இருந்தால்".
    }

    // Rule 5: SAME HOUSE RULE
    const ownedByMatchStarLord = OWN_SIGNS[matchStarLord] || [];
    if (ownedByMatchStarLord.includes(player.rashi) && ownedByMatchStarLord.includes(P[playerStarLord])) {
        addRule('BAT Rule 5: Same House', 4, 'bat', false, 'பேட்டிங் விதி 5: ஒரே ராசி');
        if (isExalted(playerRasiLord, player.rashi) || isOwnSign(playerRasiLord, player.rashi)) addRule('BAT Rule 5: Bonus', 2, 'bat', false, 'பேட்டிங் விதி 5: போனஸ்');
    }

    // Rule 6: PLAYER RASI ATHIPATHI HOME
    if (M[matchRasiLord] === player.rashi && M[matchStarLord] === player.rashi) {
        addRule('BAT Rule 6: Player Rasi Home', 6, 'bat', false, 'பேட்டிங் விதி 6: ராசி அதிபதி வீடு');
        applyBonuses(playerRasiLord, 4, 'bat');
    }

    // Rule 7: RAHU/KETU PLAYER RULE
    if (player.nakshatraLord === 'Rahu' || player.nakshatraLord === 'Ketu') {
        const matchStarSigns = OWN_SIGNS[matchStarLord] || [];
        if (matchStarSigns.includes(player.rashi)) {
            addRule('BAT Rule 7: Rahu/Ketu Player', 4, 'bat', false, 'பேட்டிங் விதி 7: ராகு/கேது விதி');
            applyBonuses(playerRasiLord, 4, 'bat');
        }
    }

    // Rule 8: LAGNA RULE (BATTING)
    if (matchLagnaLord === playerRasiLord) {
        addRule('BAT Rule 8: Lagna', 2, 'bat', false, 'பேட்டிங் விதி 8: லக்ன விதி');
        if (isExalted(playerRasiLord, player.rashi) || isOwnSign(playerRasiLord, player.rashi)) addRule('BAT Rule 8: Bonus', 2, 'bat', false, 'பேட்டிங் விதி 8: போனஸ்');
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
        if (isExalted(matchStarLord, P[matchStarLord]) || isOwnSign(matchStarLord, P[matchStarLord])) addRule('BOWL Rule 3: Bonus', 6, 'bowl', false, 'பவுலிங் விதி 3: போனஸ்');
    }


    // BOWL Rule 4: CONJUNCTION (Modified)
    // Same logic as Batting
    if (playerRasiLord && P[playerRasiLord] && P[matchStarLord] && P[matchStarLord] === P[playerRasiLord]) {
        addRule('BOWL Rule 4: Conjunction (Rasi Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: சேர்க்கை விதி (ராசி அதிபதி)');
        applyBonuses(playerRasiLord, 4, 'bowl');
        if (matchLagnaSign === P[matchStarLord]) addRule('BOWL Rule 4: Lagna Match', 2, 'bowl', false, 'பவுலிங் விதி 4: லக்ன பொருத்தம்');
    }
    else if (playerStarLord && P[playerStarLord] && P[matchStarLord] && P[matchStarLord] === P[playerStarLord]) {
        addRule('BOWL Rule 4: Conjunction (Star Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
        applyBonuses(playerStarLord, 4, 'bowl');
    }

    // BOWL Rule 5: SAME HOUSE
    const ownedByMatchLords = [...(OWN_SIGNS[matchRasiLord] || []), ...(OWN_SIGNS[matchStarLord] || [])];
    if (ownedByMatchLords.includes(player.rashi) && ownedByMatchLords.includes(P[playerStarLord])) {
        addRule('BOWL Rule 5: Same House', 4, 'bowl', false, 'பவுலிங் விதி 5: ஒரே ராசி');
        if (isExalted(playerRasiLord, player.rashi) || isOwnSign(playerRasiLord, player.rashi)) addRule('BOWL Rule 5: Bonus', 2, 'bowl', false, 'பவுலிங் விதி 5: போனஸ்');
    }

    // BOWL Rule 6: PLAYER RASI HOME
    if (M[matchRasiLord] === player.rashi && M[matchStarLord] === player.rashi) {
        addRule('BOWL Rule 6: Player Rasi Home', 4, 'bowl', false, 'பவுலிங் விதி 6: ராசி அதிபதி வீடு');
        if (isExalted(playerRasiLord, player.rashi) || isOwnSign(playerRasiLord, player.rashi)) addRule('BOWL Rule 6: Bonus', 2, 'bowl', false, 'பவுலிங் விதி 6: போனஸ்');
    }

    // BOWL Rule 7: RAHU/KETU RULE
    if (player.nakshatraLord === 'Rahu' || player.nakshatraLord === 'Ketu') {
        const matchStarSigns = OWN_SIGNS[matchStarLord] || [];
        if (matchStarSigns.includes(player.rashi)) {
            addRule('BOWL Rule 7: Rahu/Ketu', 4, 'bowl', false, 'பவுலிங் விதி 7: ராகு/கேது விதி');
            applyBonuses(playerRasiLord, 4, 'bowl');
        }
    }

    // BOWL Rule 8: LAGNA RULE
    if (matchLagnaLord === playerRasiLord) {
        addRule('BOWL Rule 8: Lagna', 4, 'bowl', false, 'பவுலிங் விதி 8: லக்ன விதி');
        applyBonuses(playerRasiLord, 4, 'bowl');
        // Any planet in that house is Aatchi/Ucham
        const planetsInLagna = Object.keys(P).filter(p => P[p] === matchLagnaSign);
        if (planetsInLagna.some(p => isExalted(p, P[p]) || isOwnSign(p, P[p]))) {
            addRule('BOWL Rule 8: Planet Bonus', 4, 'bowl', false, 'பவுலிங் விதி 8: கிரக போனஸ்');
        }
    }

    // BOWL Rule 9: MATCH SIGN LORD RULE
    if (matchRasiLord === playerRasiLord) {
        addRule('BOWL Rule 9: Match Sign Lord', 3, 'bowl', false, 'பவுலிங் விதி 9: ராசி அதிபதி விதி');
        if (isExalted(playerRasiLord, player.rashi) || isOwnSign(playerRasiLord, player.rashi)) addRule('BOWL Rule 9: Bonus', 8, 'bowl', false, 'பவுலிங் விதி 9: போனஸ்');
    }

    /* ================= MATCH STAR SPECIFIC RULES ================= */

    switch (matchStar) {
        // 1. ASWINI
        case 'Ashwini':
        case 'Aswini':
            if (isExalted('Mars', P['Mars'])) addRule('Aswini: Mars Exalted', 8, 'both', false, 'அசுவினி: செவ்வாய் உச்சம்');
            else if (isDebilitated('Mars', P['Mars'])) addRule('Aswini: Mars Debilitated', -12, 'both', false, 'அசுவினி: செவ்வாய் நீசம்');
            if (areInSameSign(['Mars', 'Venus'])) addRule('Aswini: Mars + Venus Conjunction', 10, 'both', false, 'அசுவினி: செவ்வாய் + சுக்கிரன் சேர்க்கை');
            break;

        // 2. BHARANI
        case 'Bharani':
            if (areInSameSign(['Venus', 'Mercury'])) setSureFlop('Bharani: Venus + Mercury Conjunction', 'பரணி: சுக்கிரன் + புதன் சேர்க்கை');
            break;

        // 3. ROHINI
        case 'Rohini':
            if (isDebilitated('Moon', P['Moon'])) addRule('Rohini: Moon Debilitated', 8, 'both', false, 'ரோகிணி: சந்திரன் நீசம்');
            if ((playerStar === 'Shatabhisha' || playerStar === 'Sathayam') && areInSameSign(['Saturn', 'Rahu'])) {
                addRule('Rohini: Player Sathayam & Saturn+Rahu Conjunction', 12, 'both', true, 'ரோகிணி: சதயம் நட்சத்திரம் & சனி+ராகு சேர்க்கை');
            }
            break;

        // 4. THIRUVATHIRAI
        case 'Ardra':
        case 'Thiruvathirai':
            if (playerRasiLord === 'Mars' || playerStarLord === 'Mars') addRule('Thiruvathirai: Mars Rasi/Star Lord', 4, 'both', false, 'திருவாதிரை: செவ்வாய் ராசி/நட்சத்திர அதிபதி');
            if (isOwnSign('Mars', P['Mars']) || isExalted('Mars', P['Mars'])) addRule('Thiruvathirai: Mars Own/Exalted', 10, 'both', false, 'திருவாதிரை: செவ்வாய் ஆட்சி/உச்சம்');
            break;

        // 5. AYILYAM
        case 'Ashlesha':
        case 'Ayilyam':
            if (areInSameSign(['Venus', 'Mercury'])) setSureFlop('Ayilyam: Venus + Mercury Conjunction', 'ஆயில்யம்: சுக்கிரன் + புதன் சேர்க்கை');
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

        // 8. UTHIRAM
        case 'Uttara Phalguni':
        case 'Uthiram':
            if (M['Moon'] === 'Virgo' || M['Moon'] === 'Kanya') {
                if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Uthiram (Kanya): Rasi Lord Saturn & Star Lord Rahu (+12) 👉 Show Special Player', 12, 'both', true, 'உத்திரம் (கன்னி): ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு (+12) 👉 சிறப்பு வீரர்');
            }
            break;

        // 9. CHITHIRAI
        case 'Chitra':
        case 'Chithirai':
            if (M['Moon'] === 'Virgo' || M['Moon'] === 'Kanya') {
                if (playerRasiLord === 'Mercury' && areInSameSign(['Mercury', 'Sun'])) {
                    if (areInSameSign(['Mercury', 'Sun', 'Venus', 'Jupiter'])) addRule('Chithirai (Virgo): Merc+Sun+Ven+Jup', 12, 'both', false, 'சித்திரை (கன்னி): புதன்+சூரியன்+சுக்கிரன்+குரு');
                    else if (areInSameSign(['Mercury', 'Sun', 'Jupiter'])) addRule('Chithirai (Virgo): Merc+Sun+Jup', 8, 'both', false, 'சித்திரை (கன்னி): புதன்+சூரியன்+குரு');
                    else addRule('Chithirai (Virgo): Merc+Sun', 6, 'both', false, 'சித்திரை (கன்னி): புதன்+சூரியன்');
                }
            } else if (M['Moon'] === 'Libra' || M['Moon'] === 'Thula') {
                if (playerRasiLord === 'Moon' && playerStarLord === 'Saturn') addRule('Chithirai (Libra): Rasi Lord Moon & Star Lord Saturn (+12) ⭐ Show SPECIAL PLAYER', 12, 'both', true, 'சித்திரை (துலாம்): ராசி அதிபதி சந்திரன் & நட்சத்திர அதிபதி சனி (+12) ⭐ சிறப்பு வீரர்');
            }
            break;

        // 10. ANUSHAM
        case 'Anuradha':
        case 'Anusham':
            if (playerRasiLord === 'Jupiter') {
                addRule('Anusham: Rasi Lord Jupiter', 5, 'both', false, 'அனுஷம்: ராசி அதிபதி குரு');
                if (isOwnSign('Jupiter', P['Jupiter']) || isExalted('Jupiter', P['Jupiter'])) addRule('Anusham: Jupiter Own/Exalted', 10, 'both', false, 'அனுஷம்: குரு ஆட்சி/உச்சம்');
            }
            break;

        // 11. KETTAI
        case 'Jyeshtha':
        case 'Kettai':
            if (areInSameSign(['Mercury', 'Venus'])) addRule('Kettai: Mercury + Venus Conjunction', -12, 'both', false, 'கேட்டை: புதன் + சுக்கிரன் சேர்க்கை');
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
            // Player Rasi Athipathi = Chevvai (Mars)
            else if (playerRasiLord === 'Mars') {
                // Batting 0 Point (Neutral) - Implicit as simple adding 0 or not adding anything
                addRule('Moolam: Rasi Lord Mars (Batting 0)', 0, 'bat', false, 'மூலம்: ராசி அதிபதி செவ்வாய் (பேட்டிங் 0)');

                // Bowling +4 Points
                addRule('Moolam: Rasi Lord Mars (Bowling) (+4)', 4, 'bowl', true, 'மூலம்: ராசி அதிபதி செவ்வாய் (பவுலிங்) (+4)');

                // If Aatchi / Ucham -> +6 Points (Total logic: +4 base, add +2 if Exalted/Own? Or +6 Total?)
                // Requirement: "If Aatchi / Ucham -> +6 Points".
                // Let's assume +6 TOTAL. So we add +2 extra.
                if (isOwnSign('Mars', P['Mars']) || isExalted('Mars', P['Mars'])) {
                    addRule('Moolam: Mars Ucham/Aatchi Bonus (+2)', 2, 'bowl', true, 'மூலம்: செவ்வாய் உச்சம்/ஆட்சி போனஸ் (+2)');
                }
            }
            break;

        // 13. POORADAM
        case 'Purva Ashadha':
        case 'Pooradam':
            // "Pooradam Match-ku OVERRIDE RULE"
            if (areInSameSign(['Venus', 'Mercury'])) {
                // Batting: -12 Points, Sure Flop
                // Using setSureFlop will wipe out Bowling too if "globalNegative" flag is used globally.
                // We need to handle this strictly for Batting here or modifying globalNegative logic.
                // Let's manually set batting.score negative and status instead of using global setSureFlop which affects both.

                // setSureFlop('Pooradam: Venus + Mercury Conjunction', 'பூராடம்: சுக்கிரன் + புதன் சேர்க்கை'); <- This was the old way

                addRule('Pooradam: Venus + Mercury Conjunction (Batting Sure Flop)', -12, 'bat', false, 'பூராடம்: சுக்கிரன் + புதன் சேர்க்கை (பேட்டிங் வீழ்ச்சி)');
                batting.status = "SURE FLOP"; // Manually set status if possible (returned obj has status?)
                // Note: The helper function returns {batting, bowling}. Batting internal obj has {score, logs, isSpecial}.
                // It doesn't seem to have a 'status' property in this client version?
                // Wait, server version has `status`. Client version: `const batting = { score: 0, logs: [], isSpecial: false };`
                // I will add status to the object just in case the UI uses it or it's implicitly needed.
                batting.status = "SURE FLOP";

                // Bowling: +12 Points, Show Special Player
                addRule('Pooradam: Venus + Mercury Conjunction (Bowling) (+12)', 12, 'bowl', true, 'பூராடம்: சுக்கிரன் + புதன் சேர்க்கை (பவுலிங்) (+12)');
            }
            break;

        // 14. UTHIRADAM
        case 'Uttara Ashadha':
        case 'Uthiradam':
            if (M['Moon'] === 'Capricorn' || M['Moon'] === 'Makara') {
                if (playerRasiLord === 'Moon') addRule('Uthiradam (Makara): Rasi Lord Moon (+12) 👉 Show Special Player', 12, 'both', true, 'உத்திராடம் (மகரம்): ராசி அதிபதி சந்திரன் (+12) 👉 சிறப்பு வீரர்');
            }
            break;

        // 15. THIRUVONAM
        case 'Shravana':
        case 'Thiruvonam':
            if (playerRasiLord === 'Mars' && getPlanet(player.chart, 'Mars')?.sign === 'Cancer') addRule('Thiruvonam: Mars in Moon House (Bowling) (+6)', 6, 'bowl', false, 'திருவோணம்: செவ்வாய் சந்திரன் வீட்டில் (பவுலிங்) (+6)');
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Thiruvonam: Rasi Lord Saturn & Star Lord Rahu (+12) 👉 Show Special Player', 12, 'both', true, 'திருவோணம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு (+12) 👉 சிறப்பு வீரர்');
            break;

        // 16. AVITTAM
        case 'Dhanishta':
        case 'Avittam':
            if ((M['Moon'] === 'Capricorn' || M['Moon'] === 'Makara') && playerRasiLord === 'Saturn') addRule('Avittam (Capricorn): Rasi Lord Saturn', 4, 'both', false, 'அவிட்டம் (மகரம்): ராசி அதிபதி சனி');
            break;

        // 17. SATHAYAM
        case 'Shatabhisha':
        case 'Sathayam':
            if (playerRasiLord === 'Moon') addRule('Sathayam: Rasi Lord Moon (+12) 👉 GAME CHANGER 👉 Must Show Special Player', 12, 'both', true, 'சதயம்: ராசி அதிபதி சந்திரன் (+12) 👉 கேம் சேஞ்சர் 👉 சிறப்பு வீரர்');
            break;
    }

    if (globalNegative) {
        batting.score = 0;
        bowling.score = 0;
    }

    return { batting, bowling };
}

export function evaluateBatsman(player, match, transit = {}) {
    const { batting } = getPrediction(player, match, transit);
    return batting; // { score, logs, isSpecial }
}

export function evaluateBowler(player, match, transit = {}) {
    const { bowling } = getPrediction(player, match, transit);
    return bowling; // { score, logs, isSpecial }
}
