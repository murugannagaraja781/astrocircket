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

    const P = player.planetPositions || {}; // Player Natal Positions
    const M = transit.planetPositions || {}; // Match Transit Positions

    const playerRasiLord = player.rashiLord;
    const playerStarLord = player.nakshatraLord;
    const playerStar = player.nakshatra;
    const matchStar = match.nakshatra; // Name

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

    // Helper for Conjunctions (in Player Chart)
    const areInSameSign = (planets) => {
        if (!planets || planets.length < 2) return false;
        const firstSign = P[planets[0]];
        if (!firstSign) return false;
        return planets.every(p => P[p] === firstSign);
    };

    /* ================= MATCH STAR SPECIFIC RULES ================= */
    // Using simple English names. Ensure match.nakshatra is in English.

    switch (matchStar) {
        // 1. Aswini
        case 'Ashwini':
            if (isExalted('Mars', P['Mars'])) addRule('Ashwini: Mars Exalted', 8);
            else if (isDebilitated('Mars', P['Mars'])) addRule('Ashwini: Mars Debilitated', -12);
            if (areInSameSign(['Mars', 'Venus'])) addRule('Ashwini: Mars & Venus Conjoined', 10);
            break;

        // 2. Bharani
        case 'Bharani':
            if (areInSameSign(['Venus', 'Mercury'])) addRule('Bharani: Venus & Mercury Conjoined', -12, 'both', true);
            break;

        // 3. Rohini
        case 'Rohini':
            if (isDebilitated('Moon', P['Moon'])) addRule('Rohini: Moon Debilitated', 8);
            if (playerStar === 'Shatabhisha') addRule('Rohini: Player Star Sathayam', 12, 'both', true);
            break;

        // 4. Ardra
        case 'Ardra':
            if (playerRasiLord === 'Mars' || playerStarLord === 'Mars') {
                addRule('Ardra: Mars is Rasi or Star Lord', 4);
                if (isOwnSign('Mars', P['Mars']) || isExalted('Mars', P['Mars'])) {
                    addRule('Ardra: Mars Strong', 10);
                }
            }
            break;

        // 5. Ashlesha
        case 'Ashlesha':
            if (areInSameSign(['Venus', 'Mercury'])) addRule('Ashlesha: Venus & Mercury Conjoined', -12, 'both', true);
            break;

        // 6. Magha
        case 'Magha':
            if (playerRasiLord === 'Mercury' && playerStarLord === 'Mars') {
                addRule('Magha: Rasi Lord Mercury & Star Lord Mars', 12, 'both', true);
            }
            break;

        // 7. Purva Phalguni
        case 'Purva Phalguni':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') {
                addRule('Pooram: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true);
            }
            if (playerRasiLord === 'Jupiter' && playerStarLord === 'Mercury') {
                addRule('Pooram: Rasi Lord Jupiter & Star Lord Mercury', 12, 'bowl', true);
            }
            break;

        // 8. Uttara Phalguni (Using Sign Name logic if needed, but here dependent on Moon Sign)
        case 'Uttara Phalguni':
            // Check Match Moon Sign. Transit Moon positions.
            // Virgo = Kanni. If Match Moon in Virgo.
            if (M['Moon'] === 'Virgo') {
                if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') {
                    addRule('Uthiram (Kanni): Rasi Lord Saturn & Star Lord Rahu', 12, 'both', true);
                }
            }
            break;

        // 9. Chitra
        case 'Chitra':
            if (M['Moon'] === 'Virgo') { // Padas 1,2
                if (playerRasiLord === 'Mercury') {
                    if (areInSameSign(['Mercury', 'Sun'])) {
                        const withJup = areInSameSign(['Mercury', 'Sun', 'Jupiter']);
                        const withVenJup = areInSameSign(['Mercury', 'Sun', 'Venus', 'Jupiter']);
                        if (withVenJup) addRule('Chitra (Virgo): Mercury + Sun + Venus + Jupiter', 12);
                        else if (withJup) addRule('Chitra (Virgo): Mercury + Sun + Jupiter', 8);
                        else addRule('Chitra (Virgo): Mercury + Sun', 6);
                    }
                }
            } else if (M['Moon'] === 'Libra') { // Padas 3,4
                if (playerRasiLord === 'Moon' && playerStarLord === 'Saturn') {
                    addRule('Chitra (Libra): Rasi Lord Moon & Star Lord Saturn', 12, 'both', true);
                }
            }
            break;

        // 10. Anuradha
        case 'Anuradha':
            if (playerRasiLord === 'Jupiter') {
                addRule('Anuradha: Rasi Lord Jupiter', 5, 'both', false, 'அனுஷம்: ராசி அதிபதி குரு');
                if (isOwnSign('Jupiter', P['Jupiter']) || isExalted('Jupiter', P['Jupiter'])) {
                    addRule('Anuradha: Jupiter Strong', 10, 'both', false, 'அனுஷம்: குரு வலுவாக உள்ளார்');
                }
            }
            break;

        // 11. Jyeshtha
        case 'Jyeshtha':
            if (areInSameSign(['Mercury', 'Venus'])) addRule('Jyeshtha: Mercury & Venus Conjoined', -12);
            break;

        // 12. Mula
        case 'Mula':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Mula: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true);
            else if (playerRasiLord === 'Mars' && playerStarLord === 'Saturn') addRule('Mula: Rasi Lord Mars & Star Lord Saturn', 12, 'bowl', true);
            break;

        // 13. Purva Ashadha
        case 'Purva Ashadha':
            if (areInSameSign(['Venus', 'Mercury'])) addRule('Purva Ashadha: Venus & Mercury Conjoined', -12, 'both', true);
            break;

        // 14. Uttara Ashadha
        case 'Uttara Ashadha':
            if (M['Moon'] === 'Capricorn') {
                if (playerRasiLord === 'Moon') addRule('Uthiradam (Capricorn): Rasi Lord Moon', 12, 'both', true);
            }
            break;

        // 15. Shravana
        case 'Shravana':
            if (playerRasiLord === 'Mars') {
                // Mars in Moon House (Cancer) -> Debilitated basically, but specific house check
                if (P['Mars'] === 'Cancer') addRule('Thiruvonam: Rasi Lord Mars in Moon House', 6, 'bowl');
            }
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') {
                addRule('Thiruvonam: Rasi Lord Saturn & Star Lord Rahu', 12, 'both', true);
            }
            break;

        // 16. Dhanishta
        case 'Dhanishta':
            if (M['Moon'] === 'Capricorn') {
                if (playerRasiLord === 'Saturn') addRule('Avittam (Capricorn): Rasi Lord Saturn', 4);
            }
            break;

        // 17. Shatabhisha
        case 'Shatabhisha':
            if (playerRasiLord === 'Moon') addRule('Sathayam: Rasi Lord Moon', 12, 'both', true);
            break;
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
