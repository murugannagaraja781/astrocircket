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
        addRule('BAT Rule 1: Zig-Zag', 12, 'bat');
        applyBonuses(playerRasiLord, 4, 'bat');
    }

    // Rule 2: DIRECT RULE
    if (matchRasiLord === playerRasiLord && matchStarLord === playerStarLord) {
        addRule('BAT Rule 2: Direct', 6, 'bat');
        applyBonuses(playerRasiLord, 4, 'bat');
    }

    // Rule 3: STAR RULE
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        addRule('BAT Rule 3: Star', 4, 'bat');
        applyBonuses(matchStarLord, 4, 'bat');
    }

    // Rule 4: CONJUNCTION RULE
    if (areInSameSign([matchStarLord, playerRasiLord])) {
        addRule('BAT Rule 4: Conjunction', 4, 'bat');
        applyBonuses(playerRasiLord, 4, 'bat');
        if (matchLagnaSign === player.rashi) addRule('BAT Rule 4: Lagna Match', 2, 'bat');
    }

    // Rule 5: SAME HOUSE RULE
    const ownedByMatchStarLord = OWN_SIGNS[matchStarLord] || [];
    if (ownedByMatchStarLord.includes(player.rashi) && ownedByMatchStarLord.includes(P[playerStarLord])) {
        addRule('BAT Rule 5: Same House', 4, 'bat');
        if (isExalted(playerRasiLord, player.rashi) || isOwnSign(playerRasiLord, player.rashi)) addRule('BAT Rule 5: Bonus', 2, 'bat');
    }

    // Rule 6: PLAYER RASI ATHIPATHI HOME
    if (M[matchRasiLord] === player.rashi && M[matchStarLord] === player.rashi) {
        addRule('BAT Rule 6: Player Rasi Home', 6, 'bat');
        applyBonuses(playerRasiLord, 4, 'bat');
    }

    // Rule 7: RAHU/KETU PLAYER RULE
    if (player.nakshatraLord === 'Rahu' || player.nakshatraLord === 'Ketu') {
        const matchStarSigns = OWN_SIGNS[matchStarLord] || [];
        if (matchStarSigns.includes(player.rashi)) {
            addRule('BAT Rule 7: Rahu/Ketu Player', 4, 'bat');
            applyBonuses(playerRasiLord, 4, 'bat');
        }
    }

    // Rule 8: LAGNA RULE (BATTING)
    if (matchLagnaLord === playerRasiLord) {
        addRule('BAT Rule 8: Lagna', 2, 'bat');
        if (isExalted(playerRasiLord, player.rashi) || isOwnSign(playerRasiLord, player.rashi)) addRule('BAT Rule 8: Bonus', 2, 'bat');
    }

    /* ================= GENERAL BOWLING RULES ================= */

    // BOWL Rule 1: ZIG-ZAG
    if (matchRasiLord === playerStarLord && matchStarLord === playerRasiLord) {
        addRule('BOWL Rule 1: Zig-Zag', 12, 'bowl');
        applyBonuses(playerRasiLord, 4, 'bowl');
    }

    // BOWL Rule 2: DIRECT (NEGATIVE)
    if (matchRasiLord === playerRasiLord && matchStarLord === playerStarLord) {
        addRule('BOWL Rule 2: Direct (Negative)', -12, 'bowl');
    }

    // BOWL Rule 3: STAR RULE
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        addRule('BOWL Rule 3: Star', 3, 'bowl');
        if (isExalted(matchStarLord, P[matchStarLord]) || isOwnSign(matchStarLord, P[matchStarLord])) addRule('BOWL Rule 3: Bonus', 6, 'bowl');
    }

    // BOWL Rule 4: CONJUNCTION
    const playerRasiLordSignSigns = OWN_SIGNS[playerRasiLord] || [];
    if (playerRasiLordSignSigns.includes(M[matchStarLord])) {
        addRule('BOWL Rule 4: Conjunction', 4, 'bowl');
        applyBonuses(playerRasiLord, 4, 'bowl');
        if (matchLagnaSign === M[matchStarLord]) addRule('BOWL Rule 4: Lagna Match', 2, 'bowl');
    }

    // BOWL Rule 5: SAME HOUSE
    const ownedByMatchLords = [...(OWN_SIGNS[matchRasiLord] || []), ...(OWN_SIGNS[matchStarLord] || [])];
    if (ownedByMatchLords.includes(player.rashi) && ownedByMatchLords.includes(P[playerStarLord])) {
        addRule('BOWL Rule 5: Same House', 4, 'bowl');
        if (isExalted(playerRasiLord, player.rashi) || isOwnSign(playerRasiLord, player.rashi)) addRule('BOWL Rule 5: Bonus', 2, 'bowl');
    }

    // BOWL Rule 6: PLAYER RASI HOME
    if (M[matchRasiLord] === player.rashi && M[matchStarLord] === player.rashi) {
        addRule('BOWL Rule 6: Player Rasi Home', 4, 'bowl');
        if (isExalted(playerRasiLord, player.rashi) || isOwnSign(playerRasiLord, player.rashi)) addRule('BOWL Rule 6: Bonus', 2, 'bowl');
    }

    // BOWL Rule 7: RAHU/KETU RULE
    if (player.nakshatraLord === 'Rahu' || player.nakshatraLord === 'Ketu') {
        const matchStarSigns = OWN_SIGNS[matchStarLord] || [];
        if (matchStarSigns.includes(player.rashi)) {
            addRule('BOWL Rule 7: Rahu/Ketu', 4, 'bowl');
            applyBonuses(playerRasiLord, 4, 'bowl');
        }
    }

    // BOWL Rule 8: LAGNA RULE
    if (matchLagnaLord === playerRasiLord) {
        addRule('BOWL Rule 8: Lagna', 4, 'bowl');
        applyBonuses(playerRasiLord, 4, 'bowl');
        // Any planet in that house is Aatchi/Ucham
        const planetsInLagna = Object.keys(P).filter(p => P[p] === matchLagnaSign);
        if (planetsInLagna.some(p => isExalted(p, P[p]) || isOwnSign(p, P[p]))) {
            addRule('BOWL Rule 8: Planet Bonus', 4, 'bowl');
        }
    }

    // BOWL Rule 9: MATCH SIGN LORD RULE
    if (matchRasiLord === playerRasiLord) {
        addRule('BOWL Rule 9: Match Sign Lord', 3, 'bowl');
        if (isExalted(playerRasiLord, player.rashi) || isOwnSign(playerRasiLord, player.rashi)) addRule('BOWL Rule 9: Bonus', 8, 'bowl');
    }

    /* ================= MATCH STAR SPECIFIC RULES ================= */

    switch (matchStar) {
        // 1. ASWINI
        case 'Ashwini':
        case 'Aswini':
            if (isExalted('Mars', P['Mars'])) addRule('Aswini: Mars Exalted', 8);
            else if (isDebilitated('Mars', P['Mars'])) addRule('Aswini: Mars Debilitated', -12);
            if (areInSameSign(['Mars', 'Venus'])) addRule('Aswini: Mars + Venus Conjunction', 10);
            break;

        // 2. BHARANI
        case 'Bharani':
            if (areInSameSign(['Venus', 'Mercury'])) setSureFlop('Bharani: Venus + Mercury Conjunction');
            break;

        // 3. ROHINI
        case 'Rohini':
            if (isDebilitated('Moon', P['Moon'])) addRule('Rohini: Moon Debilitated', 8);
            if ((playerStar === 'Shatabhisha' || playerStar === 'Sathayam') && areInSameSign(['Saturn', 'Rahu'])) {
                addRule('Rohini: Player Sathayam & Saturn+Rahu Conjunction', 12, 'both', true);
            }
            break;

        // 4. THIRUVATHIRAI
        case 'Ardra':
        case 'Thiruvathirai':
            if (playerRasiLord === 'Mars' || playerStarLord === 'Mars') addRule('Thiruvathirai: Mars Rasi/Star Lord', 4);
            if (isOwnSign('Mars', P['Mars']) || isExalted('Mars', P['Mars'])) addRule('Thiruvathirai: Mars Own/Exalted', 10);
            break;

        // 5. AYILYAM
        case 'Ashlesha':
        case 'Ayilyam':
            if (areInSameSign(['Venus', 'Mercury'])) setSureFlop('Ayilyam: Venus + Mercury Conjunction');
            break;

        // 6. MAGAM
        case 'Magha':
        case 'Magam':
            if (playerRasiLord === 'Mercury' && playerStarLord === 'Mars') addRule('Magam: Rasi Lord Mercury & Star Lord Mars', 12, 'both', true);
            break;

        // 7. POORAM
        case 'Purva Phalguni':
        case 'Pooram':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Pooram: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true);
            if (playerRasiLord === 'Jupiter' && playerStarLord === 'Mercury') addRule('Pooram: Rasi Lord Jupiter & Star Lord Mercury', 12, 'bowl', true);
            break;

        // 8. UTHIRAM
        case 'Uttara Phalguni':
        case 'Uthiram':
            if (M['Moon'] === 'Virgo' || M['Moon'] === 'Kanya') {
                if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Uthiram (Kanya): Rasi Lord Saturn & Star Lord Rahu', 12, 'both', true);
            }
            break;

        // 9. CHITHIRAI
        case 'Chitra':
        case 'Chithirai':
            if (M['Moon'] === 'Virgo' || M['Moon'] === 'Kanya') {
                if (playerRasiLord === 'Mercury' && areInSameSign(['Mercury', 'Sun'])) {
                    if (areInSameSign(['Mercury', 'Sun', 'Venus', 'Jupiter'])) addRule('Chithirai (Virgo): Merc+Sun+Ven+Jup', 12);
                    else if (areInSameSign(['Mercury', 'Sun', 'Jupiter'])) addRule('Chithirai (Virgo): Merc+Sun+Jup', 8);
                    else addRule('Chithirai (Virgo): Merc+Sun', 6);
                }
            } else if (M['Moon'] === 'Libra' || M['Moon'] === 'Thula') {
                if (playerRasiLord === 'Moon' && playerStarLord === 'Saturn') addRule('Chithirai (Libra): Rasi Lord Moon & Star Lord Saturn', 12, 'both', true);
            }
            break;

        // 10. ANUSHAM
        case 'Anuradha':
        case 'Anusham':
            if (playerRasiLord === 'Jupiter') {
                addRule('Anusham: Rasi Lord Jupiter', 5);
                if (isOwnSign('Jupiter', P['Jupiter']) || isExalted('Jupiter', P['Jupiter'])) addRule('Anusham: Jupiter Own/Exalted', 10);
            }
            break;

        // 11. KETTAI
        case 'Jyeshtha':
        case 'Kettai':
            if (areInSameSign(['Mercury', 'Venus'])) addRule('Kettai: Mercury + Venus Conjunction', -12);
            break;

        // 12. MOOLAM
        case 'Mula':
        case 'Moolam':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Moolam: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true);
            if (playerRasiLord === 'Mars' && playerStarLord === 'Saturn') addRule('Moolam: Rasi Lord Mars & Star Lord Saturn', 12, 'bowl', true);
            break;

        // 13. POORADAM
        case 'Purva Ashadha':
        case 'Pooradam':
            if (areInSameSign(['Venus', 'Mercury'])) setSureFlop('Pooradam: Venus + Mercury Conjunction');
            break;

        // 14. UTHIRADAM
        case 'Uttara Ashadha':
        case 'Uthiradam':
            if (M['Moon'] === 'Capricorn' || M['Moon'] === 'Makara') {
                if (playerRasiLord === 'Moon') addRule('Uthiradam (Capricorn): Rasi Lord Moon', 12, 'both', true);
            }
            break;

        // 15. THIRUVONAM
        case 'Shravana':
        case 'Thiruvonam':
            if (playerRasiLord === 'Mars' && P['Mars'] === 'Cancer') addRule('Thiruvonam: Mars in Moon House', 6, 'bowl');
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Thiruvonam: Rasi Lord Saturn & Star Lord Rahu', 12, 'both', true);
            break;

        // 16. AVITTAM
        case 'Dhanishta':
        case 'Avittam':
            if ((M['Moon'] === 'Capricorn' || M['Moon'] === 'Makara') && playerRasiLord === 'Saturn') addRule('Avittam (Capricorn): Rasi Lord Saturn', 4);
            break;

        // 17. SATHAYAM
        case 'Shatabhisha':
        case 'Sathayam':
            if (playerRasiLord === 'Moon') addRule('Sathayam: Rasi Lord Moon', 12, 'both', true);
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
