/**
 * === RULE ENGINE FOR ASTRO CRICKET PREDICTION ===
 * விதி இயந்திரம் - Updated Rules System
 *
 * BATTING RULES:
 * 1. ZigZag Rule - Match (Rasi+Star) ↔ Player (Star+Rasi) = 5 points EXCELLENT
 * 2. Star Rule - Match Star Lord = Player Rasi/Star Lord = 2pts (4pts if Atchi/Utcham)
 * 3. House Rule - Match Rasi+Star Lords same = 2pts
 * 4. Same House Rule - Player lords in Match Star Lord's house = 3pts
 * 5. Conjunction Rule - Match Star Lord conjunct Player lords = 2pts (4pts if Atchi/Utcham)
 * 6. Lagna Rule - Match Lagna Rasi Lord = Player Rasi Lord = 1pt (3pts if Atchi/Utcham)
 *
 * BOWLING RULES:
 * 1. Exact Match FLOP - Match Rasi+Star Lords = Player Rasi+Star Lords = -2 points (FLOP)
 * 2. Lagna Rasi Lord Rule - Match Lagna Rasi Lord = Player Rasi Lord = 2pts (6pts if Atchi/Utcham)
 * 3. Both Lords in House - Player Rasi+Star Lord BOTH in Match Rasi Lord's house = 4pts
 * 4. Triple Conjunction - Player Rasi Lord + Match Star Lord + Match Lagna Lord in Atchi/Utcham = 10pts
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

// Sign to Lord mapping
const SIGN_LORDS = {
    'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury',
    'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
    'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter',
    'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
};

/**
 * Get the lord of a sign
 */
function getSignLord(signName) {
    return SIGN_LORDS[signName] || null;
}

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
 * Evaluate Batsman Performance
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

    // Get Match Lagna Lord
    const matchLagnaLord = match.lagnaLord || getSignLord(match.lagnaRashi);
    const matchLagnaLordPos = planetPositions[matchLagnaLord];

    // ═══════════════════════════════════════════════════════════════════
    // BATTING RULE 1: ZIG ZAG RULE (5 Points - EXCELLENT)
    // Match (Rasi+Star) ↔ Player (Star+Rasi) Reverse Match
    // ═══════════════════════════════════════════════════════════════════
    if (match.rashiLord && match.nakshatraLord && player.rashiLord && player.nakshatraLord) {
        if (match.rashiLord === player.nakshatraLord && match.nakshatraLord === player.rashiLord) {
            score += 5;
            logs.push(`BAT Rule 1 (ZigZag): மேட்ச் (${match.rashiLord}+${match.nakshatraLord}) ↔ பிளேயர் (${player.rashiLord}+${player.nakshatraLord}) → EXCELLENT (+5)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // BATTING RULE 2: STAR RULE (2-4 Points)
    // Match Star Lord = Player Rasi Lord OR Star Lord
    // ═══════════════════════════════════════════════════════════════════
    if (match.nakshatraLord && (player.rashiLord || player.nakshatraLord)) {
        let rule2Matched = false;
        let matchedWith = '';
        let matchedPlanetPos = null;

        if (match.nakshatraLord === player.rashiLord) {
            rule2Matched = true;
            matchedWith = 'ராசி அதிபதி';
            matchedPlanetPos = playerRashiLordPos;
        } else if (match.nakshatraLord === player.nakshatraLord) {
            rule2Matched = true;
            matchedWith = 'நட்சத்திர அதிபதி';
            matchedPlanetPos = playerStarLordPos;
        }

        if (rule2Matched) {
            const dignityCheck = isInExaltedOrOwnSign(match.nakshatraLord, matchedPlanetPos);
            if (dignityCheck) {
                score += 4;
                logs.push(`BAT Rule 2 (Star): மேட்ச் நட்சத்திர அதிபதி (${match.nakshatraLord}) = பிளேயர் ${matchedWith}, ${dignityCheck.tamil} → GOOD (+4)`);
            } else {
                score += 2;
                logs.push(`BAT Rule 2 (Star): மேட்ச் நட்சத்திர அதிபதி (${match.nakshatraLord}) = பிளேயர் ${matchedWith} → GOOD (+2)`);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // BATTING RULE 3: HOUSE RULE (2 Points)
    // Match Rasi Lord AND Star Lord are SAME
    // ═══════════════════════════════════════════════════════════════════
    if (match.rashiLord && match.nakshatraLord && match.rashiLord === match.nakshatraLord) {
        score += 2;
        logs.push(`BAT Rule 3 (House): மேட்ச் ராசி அதிபதி + நட்சத்திர அதிபதி ஒன்று (${match.rashiLord}) → GOOD (+2)`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // BATTING RULE 4: SAME HOUSE RULE (3 Points)
    // Player Rasi Lord OR Star Lord in Match Star Lord's house
    // ═══════════════════════════════════════════════════════════════════
    if (match.nakshatraLord && player.rashiLord && player.nakshatraLord) {
        const rasiLordInHouse = isSignOwnedBy(playerRashiLordPos, match.nakshatraLord);
        const starLordInHouse = isSignOwnedBy(playerStarLordPos, match.nakshatraLord);

        if (rasiLordInHouse || starLordInHouse) {
            score += 3;
            logs.push(`BAT Rule 4 (SameHouse): பிளேயர் அதிபதி மேட்ச் நட்சத்திர அதிபதி (${match.nakshatraLord}) வீட்டில் → GOOD (+3)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // BATTING RULE 5: CONJUNCTION RULE (2-4 Points)
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
                logs.push(`BAT Rule 5 (Conjunction): மேட்ச் நட்சத்திர அதிபதி + பிளேயர் (${conjunctPlanet}) இணைப்பு, ${dignityCheck.tamil} → GOOD (+4)`);
            } else {
                score += 2;
                logs.push(`BAT Rule 5 (Conjunction): மேட்ச் நட்சத்திர அதிபதி + பிளேயர் (${conjunctPlanet}) இணைப்பு → GOOD (+2)`);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // BATTING RULE 6: NEW LAGNA RULE (1-3 Points)
    // Match Lagna Rasi Lord = Player Rasi Lord
    // லக்னத்தின் ராசி அதிபதியே பிளேயரின் ராசி அதிபதியாக இருந்தால்
    // ═══════════════════════════════════════════════════════════════════
    if (matchLagnaLord && player.rashiLord && matchLagnaLord === player.rashiLord) {
        const dignityCheck = isInExaltedOrOwnSign(player.rashiLord, playerRashiLordPos);
        if (dignityCheck) {
            score += 3;
            logs.push(`BAT Rule 6 (Lagna): மேட்ச் லக்ன ராசி அதிபதி (${matchLagnaLord}) = பிளேயர் ராசி அதிபதி, ${dignityCheck.tamil} → GOOD (+3)`);
        } else {
            score += 1;
            logs.push(`BAT Rule 6 (Lagna): மேட்ச் லக்ன ராசி அதிபதி (${matchLagnaLord}) = பிளேயர் ராசி அதிபதி → GOOD (+1)`);
        }
    }

    return { score, logs };
}

/**
 * Evaluate Bowler Performance - Separate Bowling Rules
 */
export function evaluateBowler(player, match, transit = {}) {
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
    const matchRashiLordPos = planetPositions[match.rashiLord];

    // Get Match Lagna Lord
    const matchLagnaLord = match.lagnaLord || getSignLord(match.lagnaRashi);
    const matchLagnaLordPos = planetPositions[matchLagnaLord];

    // ═══════════════════════════════════════════════════════════════════
    // BOWLING RULE 1: EXACT MATCH FLOP (-2 Points)
    // Match Rasi+Star Lord = Player Rasi+Star Lord → SURE FLOP
    // Ex: Match = குரு + புதன், Player = குரு + புதன்
    // ═══════════════════════════════════════════════════════════════════
    if (match.rashiLord && match.nakshatraLord && player.rashiLord && player.nakshatraLord) {
        if (match.rashiLord === player.rashiLord && match.nakshatraLord === player.nakshatraLord) {
            score -= 2;
            logs.push(`BOWL Rule 1 (ExactMatch): மேட்ச் (${match.rashiLord}+${match.nakshatraLord}) = பிளேயர் (${player.rashiLord}+${player.nakshatraLord}) → SURE FLOP (-2)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // BOWLING RULE 2: LAGNA RASI LORD RULE (2-6 Points)
    // Match Lagna Rasi Lord = Player Rasi Lord
    // மேட்ச் லக்ன ராசி அதிபதி = பிளேயர் ராசி அதிபதி
    // ═══════════════════════════════════════════════════════════════════
    if (matchLagnaLord && player.rashiLord && matchLagnaLord === player.rashiLord) {
        const dignityCheck = isInExaltedOrOwnSign(player.rashiLord, playerRashiLordPos);
        if (dignityCheck) {
            score += 6;
            logs.push(`BOWL Rule 2 (Lagna): மேட்ச் லக்ன ராசி அதிபதி (${matchLagnaLord}) = பிளேயர் ராசி அதிபதி, ${dignityCheck.tamil} → VERY GOOD (+6)`);
        } else {
            score += 2;
            logs.push(`BOWL Rule 2 (Lagna): மேட்ச் லக்ன ராசி அதிபதி (${matchLagnaLord}) = பிளேயர் ராசி அதிபதி → GOOD (+2)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // BOWLING RULE 3: BOTH LORDS IN HOUSE (4 Points)
    // Player Rasi Lord AND Star Lord BOTH in Match Rasi Lord's house
    // பிளேயர் ராசி அதிபதி மற்றும் நட்சத்திர அதிபதி இரண்டும் சேர்ந்து மேட்ச் ராசி அதிபதி வீட்டில்
    // ═══════════════════════════════════════════════════════════════════
    if (match.rashiLord && player.rashiLord && player.nakshatraLord) {
        const playerRasiLordInMatchHouse = isSignOwnedBy(playerRashiLordPos, match.rashiLord);
        const playerStarLordInMatchHouse = isSignOwnedBy(playerStarLordPos, match.rashiLord);

        if (playerRasiLordInMatchHouse && playerStarLordInMatchHouse) {
            score += 4;
            logs.push(`BOWL Rule 3 (BothInHouse): பிளேயர் ராசி+நட்சத்திர அதிபதி இரண்டும் மேட்ச் ராசி அதிபதி (${match.rashiLord}) வீட்டில் → GOOD (+4)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // BOWLING RULE 4: TRIPLE CONJUNCTION (10 Points)
    // Player Rasi Lord + Match Star Lord + Match Lagna Lord conjunct in Atchi/Utcham
    // பிளேயர் ராசி அதிபதி + மேட்ச் நட்சத்திர அதிபதி + மேட்ச் லக்ன ராசி அதிபதி இணைந்து ஆட்சி/உச்சம்
    // ═══════════════════════════════════════════════════════════════════
    if (playerRashiLordPos && matchStarLordPos && matchLagnaLordPos) {
        // Check if all three are in the same sign (conjunct)
        if (playerRashiLordPos === matchStarLordPos && matchStarLordPos === matchLagnaLordPos) {
            const dignityCheck = isInExaltedOrOwnSign(player.rashiLord, playerRashiLordPos);
            if (dignityCheck) {
                score += 10;
                logs.push(`BOWL Rule 4 (TripleConjunction): பிளேயர் ராசி அதிபதி + மேட்ச் நட்சத்திர அதிபதி + லக்ன அதிபதி இணைப்பு, ${dignityCheck.tamil} → EXCELLENT (+10)`);
            }
        }
    }

    return { score, logs };
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
