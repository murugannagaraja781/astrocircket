/**
 * === RULE ENGINE FOR ASTRO CRICKET PREDICTION ===
 * விதி இயந்திரம் - 6 Rules System
 *
 * RULES:
 * 1. ZigZag Rule - Match (Rasi+Star) ↔ Player (Star+Rasi) = 5 points EXCELLENT
 * 2. Star Rule - Match Star = Player Sign Lord = 2pts (4pts if Atchi/Utcham)
 * 3. House Rule - Match Rasi+Star Lords same = 2pts
 * 4. Same House Rule - Player lords in Match Star Lord's house = 3pts
 * 5. Conjunction Rule - Match Star Lord conjunct Player lords = 2pts (4pts if Atchi/Utcham)
 * 6. Lagna Rule - Match Lagna = Player Sign Lord's sign = 2pts (4pts if Atchi/Utcham)
 */

// Exalted Signs (உச்சம்)
const EXALTED_SIGNS = {
    'Sun': 'Aries', 'Moon': 'Taurus', 'Mars': 'Capricorn',
    'Mercury': 'Virgo', 'Jupiter': 'Cancer', 'Venus': 'Pisces',
    'Saturn': 'Libra', 'Rahu': 'Taurus', 'Ketu': 'Scorpio'
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

/**
 * Check if planet is in Exalted or Own Sign
 */
function isInExaltedOrOwnSign(planetName, signName) {
    if (!planetName || !signName) return false;

    if (EXALTED_SIGNS[planetName] === signName) {
        return { status: 'EXALTED', tamil: 'உச்சம்' };
    }

    if (OWN_SIGNS[planetName]?.includes(signName)) {
        return { status: 'OWN_SIGN', tamil: 'ஆட்சி' };
    }

    return false;
}

/**
 * Helper to check if a sign belongs to a lord
 */
const isSignOwnedBy = (sign, lord) => {
    return OWN_SIGNS[lord]?.includes(sign) || false;
};

/**
 * Evaluate Batsman Performance - 6 Rules System
 * @param {Object} player - Player's normalized chart data
 * @param {Object} match - Match chart data
 * @param {Object} transit - Transit data (planetPositions map)
 */
export function evaluateBatsman(player, match, transit = {}) {
    let score = 0;
    let logs = [];

    if (!player || !match) {
        return { score: 0, logs: ['Missing data'] };
    }

    // Get positions from transit
    const planetPositions = transit.planetPositions || {};
    const playerRashiLordPos = planetPositions[player.rashiLord];
    const playerStarLordPos = planetPositions[player.nakshatraLord];
    const matchStarLordPos = planetPositions[match.nakshatraLord];

    // ═══════════════════════════════════════════════════════════════════
    // RULE 1: ZIG ZAG RULE (5 Points - EXCELLENT)
    // Match (Rasi+Star) ↔ Player (Star+Rasi) Reverse Match
    // Ex: Match = Guru + Pudhan, Player = Pudhan + Guru
    // ═══════════════════════════════════════════════════════════════════
    if (match.rashiLord && match.nakshatraLord && player.rashiLord && player.nakshatraLord) {
        if (match.rashiLord === player.nakshatraLord && match.nakshatraLord === player.rashiLord) {
            score += 5;
            logs.push(`Rule 1 (ZigZag): மேட்ச் (${match.rashiLord}+${match.nakshatraLord}) ↔ பிளேயர் (${player.rashiLord}+${player.nakshatraLord}) → EXCELLENT (+5)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 2: STAR RULE (2-4 Points)
    // Match Star Lord = Player Sign Lord
    // ═══════════════════════════════════════════════════════════════════
    if (match.nakshatraLord && player.rashiLord && match.nakshatraLord === player.rashiLord) {
        const dignityCheck = isInExaltedOrOwnSign(player.rashiLord, playerRashiLordPos);
        if (dignityCheck) {
            score += 4;
            logs.push(`Rule 2 (Star): மேட்ச் நட்சத்திர அதிபதி (${match.nakshatraLord}) = பிளேயர் ராசி அதிபதி, ${dignityCheck.tamil} → GOOD (+4)`);
        } else {
            score += 2;
            logs.push(`Rule 2 (Star): மேட்ச் நட்சத்திர அதிபதி (${match.nakshatraLord}) = பிளேயர் ராசி அதிபதி (${player.rashiLord}) → GOOD (+2)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 3: PLAYER SIGN LORD HOUSE RULE (2 Points)
    // Match Rasi Lord AND Star Lord are SAME
    // ═══════════════════════════════════════════════════════════════════
    if (match.rashiLord && match.nakshatraLord && match.rashiLord === match.nakshatraLord) {
        score += 2;
        logs.push(`Rule 3 (House): மேட்ச் ராசி அதிபதி + நட்சத்திர அதிபதி ஒன்று (${match.rashiLord}) → GOOD (+2)`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 4: SAME HOUSE RULE (3 Points)
    // Player Sign Lord OR Star Lord in Match Star Lord's house
    // ═══════════════════════════════════════════════════════════════════
    if (match.nakshatraLord && player.rashiLord && player.nakshatraLord) {
        const rasiLordInHouse = isSignOwnedBy(playerRashiLordPos, match.nakshatraLord);
        const starLordInHouse = isSignOwnedBy(playerStarLordPos, match.nakshatraLord);

        if (rasiLordInHouse || starLordInHouse) {
            score += 3;
            logs.push(`Rule 4 (SameHouse): பிளேயர் அதிபதி மேட்ச் நட்சத்திர அதிபதி (${match.nakshatraLord}) வீட்டில் → GOOD (+3)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 5: CONJUNCTION RULE (2-4 Points)
    // Match Star Lord conjunct with Player Rasi Lord OR Star Lord
    // ═══════════════════════════════════════════════════════════════════
    if (matchStarLordPos && (playerRashiLordPos || playerStarLordPos)) {
        let conjunctFound = false;
        let conjunctPlanet = '';

        if (matchStarLordPos === playerRashiLordPos) {
            conjunctFound = true;
            conjunctPlanet = player.rashiLord;
        } else if (matchStarLordPos === playerStarLordPos) {
            conjunctFound = true;
            conjunctPlanet = player.nakshatraLord;
        }

        if (conjunctFound) {
            const dignityCheck = isInExaltedOrOwnSign(conjunctPlanet, matchStarLordPos);
            if (dignityCheck) {
                score += 4;
                logs.push(`Rule 5 (Conjunction): மேட்ச் நட்சத்திர அதிபதி + பிளேயர் (${conjunctPlanet}) இணைப்பு, ${dignityCheck.tamil} → GOOD (+4)`);
            } else {
                score += 2;
                logs.push(`Rule 5 (Conjunction): மேட்ச் நட்சத்திர அதிபதி + பிளேயர் (${conjunctPlanet}) இணைப்பு → GOOD (+2)`);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 6: LAGNA RULE (2-4 Points)
    // Match Lagna Rasi = Player Sign Lord position
    // ═══════════════════════════════════════════════════════════════════
    if (match.lagnaRashi && player.rashiLord && playerRashiLordPos) {
        if (playerRashiLordPos === match.lagnaRashi) {
            const dignityCheck = isInExaltedOrOwnSign(player.rashiLord, playerRashiLordPos);
            if (dignityCheck) {
                score += 4;
                logs.push(`Rule 6 (Lagna): மேட்ச் லக்னம் (${match.lagnaRashi}) = பிளேயர் ராசி அதிபதி இடம், ${dignityCheck.tamil} → GOOD (+4)`);
            } else {
                score += 2;
                logs.push(`Rule 6 (Lagna): மேட்ச் லக்னம் (${match.lagnaRashi}) ல் பிளேயர் ராசி அதிபதி → GOOD (+2)`);
            }
        }
    }

    return { score, logs };
}

/**
 * Evaluate Bowler Performance - Same 6 Rules
 */
export function evaluateBowler(player, match, transit = {}) {
    // Same rules apply for bowling
    return evaluateBatsman(player, match, transit);
}

/**
 * Get opposite sign (7th from current sign)
 */
function getOppositeSign(signName) {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const idx = signs.indexOf(signName);
    if (idx === -1) return null;
    return signs[(idx + 6) % 12];
}
