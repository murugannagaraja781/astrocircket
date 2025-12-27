// ruleEngine.js
// விதி இயந்திரம் - Vedic Astrology Prediction Rules for Cricket

/**
 * RULE 1 – Batting (Main Rule)
 * இன்றைய மேட்ச் நட்சத்திர அதிபதியுடன், பிளேயரின் ராசி அதிபதி அல்லது நட்சத்திர அதிபதி இணைந்து இருந்தால்
 * → Batting : GOOD
 * அதே இணைப்பு ஆட்சி உச்ச நிலையில் இருந்தால்
 * → Batting : EXCELLENT
 *
 * RULE 2 – Batting / Bowling Split Rule
 * இன்றைய மேட்ச் ராசி + நட்சத்திரம், பிளேயரின் ராசி + நட்சத்திரத்துடன் ஒன்றாக இருந்தால்
 * → Batting : GOOD, Bowling : SURE FLOP
 *
 * RULE 3 – Rahu / Ketu Special Batting Rule
 * ஒரு பிளேயர் ராகு அல்லது கேது நட்சத்திரத்தில் பிறந்தவராக இருந்து, மற்ற ரூல்ஸ்களில் பொருந்தவில்லை என்றாலும்:
 * அந்த பிளேயரின் ராசி அதிபதி, அன்றைய மேட்ச் நடக்கும் ராசி அதிபதி அல்லது நட்சத்திர அதிபதியுடன் இணைந்து இருந்தால்
 * → Batting : GOOD
 */

// Exalted Signs for each planet (உச்ச ராசி)
const EXALTED_SIGNS = {
    'Sun': 'Aries',
    'Moon': 'Taurus',
    'Mars': 'Capricorn',
    'Mercury': 'Virgo',
    'Jupiter': 'Cancer',
    'Venus': 'Pisces',
    'Saturn': 'Libra',
    'Rahu': 'Taurus',  // Traditional view
    'Ketu': 'Scorpio'  // Traditional view
};

// Own Signs for each planet (ஆட்சி ராசி)
const OWN_SIGNS = {
    'Sun': ['Leo'],
    'Moon': ['Cancer'],
    'Mars': ['Aries', 'Scorpio'],
    'Mercury': ['Gemini', 'Virgo'],
    'Jupiter': ['Sagittarius', 'Pisces'],
    'Venus': ['Taurus', 'Libra'],
    'Saturn': ['Capricorn', 'Aquarius'],
    'Rahu': ['Aquarius'],  // Co-rule
    'Ketu': ['Scorpio']    // Co-rule
};

// Rahu nakshatras (ராகு நட்சத்திரங்கள்)
const RAHU_NAKSHATRAS = ['Ardra', 'Swati', 'Shatabhisha'];

// Ketu nakshatras (கேது நட்சத்திரங்கள்)
const KETU_NAKSHATRAS = ['Ashwini', 'Magha', 'Mula', 'Moola'];

/**
 * Check if a planet is in Exalted (உச்சம்) or Own Sign (ஆட்சி) state
 */
function isInExaltedOrOwnSign(planetName, signName) {
    if (!planetName || !signName) return false;

    // Check Exalted
    if (EXALTED_SIGNS[planetName] === signName) {
        return { status: 'EXALTED', tamil: 'உச்சம்' };
    }

    // Check Own Sign
    if (OWN_SIGNS[planetName] && OWN_SIGNS[planetName].includes(signName)) {
        return { status: 'OWN_SIGN', tamil: 'ஆட்சி' };
    }

    return false;
}

/**
 * Check if player born under Rahu or Ketu nakshatra
 */
function isRahuKetuNakshatra(nakshatraName) {
    if (!nakshatraName) return false;
    const n = nakshatraName.toLowerCase();

    // Check Rahu nakshatras
    for (const nak of RAHU_NAKSHATRAS) {
        if (n.includes(nak.toLowerCase())) return 'Rahu';
    }

    // Check Ketu nakshatras
    for (const nak of KETU_NAKSHATRAS) {
        if (n.includes(nak.toLowerCase())) return 'Ketu';
    }

    return false;
}

/**
 * Evaluate Batsman Performance
 * @param {Object} player - Player's normalized chart data
 * @param {Object} match - Match chart data
 * @param {Object} transit - Transit data (planetPositions map)
 */
export function evaluateBatsman(player, match, transit) {
    let score = 0;
    let logs = [];
    let rule1Applied = false;
    let rule2Applied = false;

    // Get planet positions for conjunction checks
    const matchStarLordPos = transit.planetPositions?.[match.nakshatraLord];
    const matchRashiLordPos = transit.planetPositions?.[match.rashiLord];
    const playerRashiLordPos = transit.planetPositions?.[player.rashiLord];
    const playerStarLordPos = transit.planetPositions?.[player.nakshatraLord];

    // ═══════════════════════════════════════════════════════════════════
    // RULE 1 – Batting (Main Rule) - நட்சத்திர அதிபதி இணைப்பு
    // ═══════════════════════════════════════════════════════════════════
    // Match Star Lord + Player Rasi Lord Conjunction
    if (match.nakshatraLord && player.rashiLord) {
        if (match.nakshatraLord === player.rashiLord) {
            // Direct match - same planet
            const dignityCheck = isInExaltedOrOwnSign(match.nakshatraLord, matchStarLordPos);
            if (dignityCheck) {
                score += 4;
                logs.push(`Rule 1: மேட்ச் நட்சத்திர அதிபதி (${match.nakshatraLord}) = பிளேயர் ராசி அதிபதி, ${dignityCheck.tamil} நிலையில் → EXCELLENT`);
                rule1Applied = true;
            } else {
                score += 2;
                logs.push(`Rule 1: மேட்ச் நட்சத்திர அதிபதி (${match.nakshatraLord}) = பிளேயர் ராசி அதிபதி (${player.rashiLord}) → GOOD`);
                rule1Applied = true;
            }
        } else if (matchStarLordPos && playerRashiLordPos && matchStarLordPos === playerRashiLordPos) {
            // Same house conjunction
            const dignityCheck = isInExaltedOrOwnSign(player.rashiLord, playerRashiLordPos);
            if (dignityCheck) {
                score += 4;
                logs.push(`Rule 1: மேட்ச் நட்சத்திர அதிபதி + பிளேயர் ராசி அதிபதி ${matchStarLordPos} ல் இணைப்பு, ${dignityCheck.tamil} நிலை → EXCELLENT`);
                rule1Applied = true;
            } else {
                score += 2;
                logs.push(`Rule 1: மேட்ச் நட்சத்திர அதிபதி (${match.nakshatraLord}) + பிளேயர் ராசி அதிபதி (${player.rashiLord}) ${matchStarLordPos} ல் இணைப்பு → GOOD`);
                rule1Applied = true;
            }
        }
    }

    // Match Star Lord + Player Star Lord Conjunction
    if (!rule1Applied && match.nakshatraLord && player.nakshatraLord) {
        if (match.nakshatraLord === player.nakshatraLord) {
            const dignityCheck = isInExaltedOrOwnSign(match.nakshatraLord, matchStarLordPos);
            if (dignityCheck) {
                score += 4;
                logs.push(`Rule 1: மேட்ச் நட்சத்திர அதிபதி = பிளேயர் நட்சத்திர அதிபதி (${match.nakshatraLord}), ${dignityCheck.tamil} நிலை → EXCELLENT`);
                rule1Applied = true;
            } else {
                score += 2;
                logs.push(`Rule 1: மேட்ச் நட்சத்திர அதிபதி = பிளேயர் நட்சத்திர அதிபதி (${match.nakshatraLord}) → GOOD`);
                rule1Applied = true;
            }
        } else if (matchStarLordPos && playerStarLordPos && matchStarLordPos === playerStarLordPos) {
            const dignityCheck = isInExaltedOrOwnSign(player.nakshatraLord, playerStarLordPos);
            if (dignityCheck) {
                score += 4;
                logs.push(`Rule 1: மேட்ச் & பிளேயர் நட்சத்திர அதிபதிகள் ${matchStarLordPos} ல் இணைப்பு, ${dignityCheck.tamil} நிலை → EXCELLENT`);
                rule1Applied = true;
            } else {
                score += 2;
                logs.push(`Rule 1: மேட்ச் நட்சத்திர அதிபதி (${match.nakshatraLord}) + பிளேயர் நட்சத்திர அதிபதி (${player.nakshatraLord}) ${matchStarLordPos} ல் இணைப்பு → GOOD`);
                rule1Applied = true;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 2 – Batting / Bowling Split Rule - ராசி + நட்சத்திரம் ஒன்றாக
    // ═══════════════════════════════════════════════════════════════════
    if (player.rashi === match.rashi && player.nakshatra === match.nakshatra) {
        score += 2;
        logs.push(`Rule 2: மேட்ச் ராசி (${match.rashi}) + நட்சத்திரம் (${match.nakshatra}) = பிளேயர் ராசி + நட்சத்திரம் → Batting GOOD`);
        rule2Applied = true;
    }

    // ═══════════════════════════════════════════════════════════════════
    // RULE 3 – Rahu / Ketu Special Batting Rule (Fallback)
    // ═══════════════════════════════════════════════════════════════════
    if (!rule1Applied) {
        const rahuKetuStatus = isRahuKetuNakshatra(player.nakshatra);

        if (rahuKetuStatus) {
            // Player born in Rahu/Ketu nakshatra
            // Check if player's rasi lord conjuncts with match rasi lord or match star lord

            // Conjunction with Match Rasi Lord
            if (player.rashiLord === match.rashiLord) {
                score += 2;
                logs.push(`Rule 3: ${rahuKetuStatus} நட்சத்திரம் - பிளேயர் ராசி அதிபதி (${player.rashiLord}) = மேட்ச் ராசி அதிபதி → GOOD`);
            } else if (player.rashiLord === match.nakshatraLord) {
                score += 2;
                logs.push(`Rule 3: ${rahuKetuStatus} நட்சத்திரம் - பிளேயர் ராசி அதிபதி (${player.rashiLord}) = மேட்ச் நட்சத்திர அதிபதி → GOOD`);
            } else if (playerRashiLordPos && matchRashiLordPos && playerRashiLordPos === matchRashiLordPos) {
                score += 2;
                logs.push(`Rule 3: ${rahuKetuStatus} நட்சத்திரம் - பிளேயர் ராசி அதிபதி + மேட்ச் ராசி அதிபதி ${playerRashiLordPos} ல் இணைப்பு → GOOD`);
            } else if (playerRashiLordPos && matchStarLordPos && playerRashiLordPos === matchStarLordPos) {
                score += 2;
                logs.push(`Rule 3: ${rahuKetuStatus} நட்சத்திரம் - பிளேயர் ராசி அதிபதி + மேட்ச் நட்சத்திர அதிபதி ${playerRashiLordPos} ல் இணைப்பு → GOOD`);
            }
        }
    }

    return { score, logs, rule2Applied };
}

/**
 * Evaluate Bowler Performance
 * @param {Object} player - Player's normalized chart data
 * @param {Object} match - Match chart data
 * @param {Object} transit - Transit data (planetPositions map)
 */
export function evaluateBowler(player, match, transit) {
    let score = 0;
    let logs = [];

    // Get planet positions
    const matchStarLordPos = transit.planetPositions?.[match.nakshatraLord];
    const matchRashiLordPos = transit.planetPositions?.[match.rashiLord];
    const playerRashiLordPos = transit.planetPositions?.[player.rashiLord];
    const playerStarLordPos = transit.planetPositions?.[player.nakshatraLord];

    // ═══════════════════════════════════════════════════════════════════
    // RULE 2 – Bowling Split Rule - SURE FLOP Condition
    // ═══════════════════════════════════════════════════════════════════
    if (player.rashi === match.rashi && player.nakshatra === match.nakshatra) {
        score = -5; // Strong negative for SURE FLOP
        logs.push(`Rule 2: மேட்ச் ராசி + நட்சத்திரம் = பிளேயர் ராசி + நட்சத்திரம் → Bowling SURE FLOP`);
        return { score, logs };
    }

    // ═══════════════════════════════════════════════════════════════════
    // Standard Bowling Rules (When Rule 2 doesn't apply)
    // ═══════════════════════════════════════════════════════════════════

    // Match Rasi Lord matches Player Rasi Lord
    if (match.rashiLord === player.rashiLord) {
        score += 1;
        logs.push(`மேட்ச் ராசி அதிபதி = பிளேயர் ராசி அதிபதி (${match.rashiLord}) → Bowling GOOD`);
    }

    // Match Star Lord matches Player Star Lord (in different signs - good for bowling)
    if (match.nakshatraLord === player.nakshatraLord && matchStarLordPos !== playerStarLordPos) {
        score += 1;
        logs.push(`மேட்ச் நட்சத்திர அதிபதி = பிளேயர் நட்சத்திர அதிபதி (${match.nakshatraLord}) → Bowling GOOD`);
    }

    // Player Rasi Lord is strong (Exalted/Own Sign) - good for bowling
    if (playerRashiLordPos) {
        const dignityCheck = isInExaltedOrOwnSign(player.rashiLord, playerRashiLordPos);
        if (dignityCheck) {
            score += 2;
            logs.push(`பிளேயர் ராசி அதிபதி (${player.rashiLord}) ${dignityCheck.tamil} நிலையில் → Bowling GOOD`);
        }
    }

    // Opposite lords - tension creates wickets
    if (matchStarLordPos && playerRashiLordPos && matchStarLordPos !== playerRashiLordPos) {
        const opposition = getOppositeSign(matchStarLordPos);
        if (opposition === playerRashiLordPos) {
            score += 2;
            logs.push(`மேட்ச் நட்சத்திர அதிபதி எதிர் நிலையில் → Bowling EXCELLENT`);
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
