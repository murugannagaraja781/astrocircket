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
 * Common Prediction Logic for both Batting and Bowling
 */
function getPrediction(player, match, transit) {
    const batting = { score: 0, logs: [], isSpecial: false };
    const bowling = { score: 0, logs: [], isSpecial: false };

    if (!player || !match) return { batting, bowling };

    const planetPositions = transit.planetPositions || {};
    const P = player.planetPositions || {}; // Player Natal/Current positions used for dignity

    const playerRasiLord = player.rashiLord;
    const playerStarLord = player.nakshatraLord;
    const playerStar = player.nakshatra;
    const matchStar = match.nakshatra;

    const addRule = (name, score, type = 'both', isSpecialRule = false, nameTamil = '') => {
        const ruleText = `${name} (${score > 0 ? '+' : ''}${score})`;
        const ruleTextTamil = nameTamil ? `${nameTamil} (${score > 0 ? '+' : ''}${score})` : ruleText;

        const logEntry = ruleTextTamil; // Mobile uses direct string logs based on previous logic

        if (type === 'both' || type === 'bat') {
            batting.score += score;
            batting.logs.push(logEntry);
            if (isSpecialRule) batting.isSpecial = true;
        }
        if (type === 'both' || type === 'bowl') {
            bowling.score += score;
            bowling.logs.push(logEntry);
            if (isSpecialRule) bowling.isSpecial = true;
        }
    };

    const areInSameSign = (lords) => {
        if (!lords || lords.length < 2) return false;
        const first = planetPositions[lords[0]];
        if (!first) return false;
        return lords.every(l => planetPositions[l] === first);
    };

    // 1. ORIGINAL CORE BATTING RULES (Re-implemented for consistency)
    if (match.rashiLord === player.nakshatraLord && match.nakshatraLord === player.rashiLord) {
        addRule('BAT Rule 1 (ZigZag)', 5, 'bat', true, 'ஜிக் ஜாக் விதி - ராசி/நட்சத்திர பரிவர்த்தனை');
    }

    // 2. NAKSHATRA SPECIFIC RULES (27 Stars Coverage)
    switch (matchStar) {
        case 'Ashwini':
            if (isInExaltedOrOwnSign('Mars', planetPositions['Mars'])) addRule('Ashwini: Mars Strong', 8, 'both', false, 'அஸ்வினி: செவ்வாய் பலம்');
            break;
        case 'Bharani':
            if (areInSameSign(['Venus', 'Mercury'])) addRule('Bharani: Venus & Mercury Conjoined', -12, 'both', true, 'பரணி: சுக்கிரன் & புதன் சேர்க்கை');
            break;
        case 'Krittika':
            if (isInExaltedOrOwnSign('Sun', planetPositions['Sun'])) addRule('Krittika: Sun Strong', 8, 'both', false, 'கார்த்திகை: சூரியன் பலம்');
            break;
        case 'Rohini':
            if (playerStar === 'Shatabhisha' || playerStar === 'Sathayam') addRule('Rohini: Player Star Sathayam', 12, 'both', true, 'ரோகிணி: பிளேயர் நட்சத்திரம் சதயம்');
            break;
        case 'Mrigashira':
            if (playerRasiLord === 'Mars') addRule('Mrigashira: Rasi Lord Mars', 6, 'both', false, 'மிருகசீரிஷம்: ராசி அதிபதி செவ்வாய்');
            break;
        case 'Ardra':
        case 'Thiruvathirai':
            if (playerRasiLord === 'Mars' || playerStarLord === 'Mars') addRule('Ardra: Mars Influence', 4, 'both', false, 'திருவாதிரை: செவ்வாய் ஆதிக்கம்');
            break;
        case 'Punarvasu':
            if (playerRasiLord === 'Jupiter') addRule('Punarvasu: Rasi Lord Jupiter', 6, 'both', false, 'புனர்பூசம்: ராசி அதிபதி குரு');
            break;
        case 'Pushya':
        case 'Poosam':
            if (playerStarLord === 'Saturn') addRule('Pushya: Star Lord Saturn', 6, 'both', false, 'பூசம்: நட்சத்திர அதிபதி சனி');
            break;
        case 'Ashlesha':
        case 'Ayilyam':
            if (areInSameSign(['Venus', 'Mercury'])) addRule('Ashlesha: Venus & Mercury Conjoined', -12, 'both', true, 'ஆயில்யம்: சுக்கிரன் & புதன் சேர்க்கை');
            break;
        case 'Magha':
        case 'Magam':
            if (playerRasiLord === 'Mercury' && playerStarLord === 'Mars') addRule('Magam: Mercury & Mars Influence', 12, 'both', true, 'மகம்: புதன் & செவ்வாய் ஆதிக்கம்');
            break;
        case 'Purva Phalguni':
        case 'Pooram':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Pooram: Saturn & Mars (Bat)', 12, 'bat', true, 'பூரம்: சனி & செவ்வாய் (பேட்டிங்)');
            if (playerRasiLord === 'Jupiter' && playerStarLord === 'Mercury') addRule('Pooram: Jupiter & Mercury (Bowl)', 12, 'bowl', true, 'பூரம்: குரு & புதன் (பவுலிங்)');
            break;
        case 'Uttara Phalguni':
        case 'Uthiram':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Uthiram: Saturn & Rahu Influence', 12, 'both', true, 'உத்திரம்: சனி & ராகு ஆதிக்கம்');
            break;
        case 'Hasta':
        case 'Hastham':
            if (playerStarLord === 'Moon') addRule('Hastham: Star Lord Moon', 6, 'both', false, 'ஹஸ்தம்: நட்சத்திர அதிபதி சந்திரன்');
            break;
        case 'Chitra':
        case 'Chithirai':
            if (playerRasiLord === 'Moon' && playerStarLord === 'Saturn') addRule('Chithirai: Moon & Saturn Influence', 12, 'both', true, 'சித்திரை: சந்திரன் & சனி ஆதிக்கம்');
            break;
        case 'Swati':
            if (playerStarLord === 'Rahu') addRule('Swati: Star Lord Rahu', 6, 'both', false, 'சுவாதி: நட்சத்திர அதிபதி ராகு');
            break;
        case 'Vishakha':
        case 'Visakam':
            if (playerRasiLord === 'Jupiter') addRule('Visakam: Rasi Lord Jupiter', 6, 'both', false, 'விசாகம்: ராசி அதிபதி குரு');
            break;
        case 'Anuradha':
        case 'Anusham':
            if (playerRasiLord === 'Jupiter') addRule('Anuradha: Rasi Lord Jupiter', 5, 'both', false, 'அனுஷம்: ராசி அதிபதி குரு');
            break;
        case 'Jyeshtha':
        case 'Kettai':
            if (areInSameSign(['Mercury', 'Venus'])) addRule('Kettai: Mercury & Venus Conjoined', -12, 'both', true, 'கேட்டை: புதன் & சுக்கிரன் சேர்க்கை');
            break;
        case 'Mula':
        case 'Moolam':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Moolam: Saturn & Mars', 12, 'both', true, 'மூலம்: சனி & செவ்வாய் ஆதிக்கம்');
            break;
        case 'Purva Ashadha':
        case 'Pooradam':
            if (areInSameSign(['Venus', 'Mercury'])) addRule('Pooradam: Venus & Mercury Conjoined', -12, 'both', true, 'பூராடம்: சுக்கிரன் & புதன் சேர்க்கை');
            break;
        case 'Uttara Ashadha':
        case 'Uthiradam':
            if (playerRasiLord === 'Moon') addRule('Uthiradam: Rasi Lord Moon', 12, 'both', true, 'உத்திராடம்: ராசி அதிபதி சந்திரன்');
            break;
        case 'Shravana':
        case 'Thiruvonam':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Thiruvonam: Saturn & Rahu', 12, 'both', true, 'திருவோணம்: சனி & ராகு ஆதிக்கம்');
            break;
        case 'Dhanishta':
        case 'Avittam':
            if (playerRasiLord === 'Saturn') addRule('Avittam: Rasi Lord Saturn', 4, 'both', false, 'அவிட்டம்: ராசி அதிபதி சனி');
            break;
        case 'Shatabhisha':
        case 'Sathayam':
            if (playerRasiLord === 'Moon') addRule('Sathayam: Rasi Lord Moon', 12, 'both', true, 'சதயம்: ராசி அதிபதி சந்திரன்');
            break;
        case 'Purva Bhadrapada':
        case 'Poorattadhi':
            if (playerStarLord === 'Jupiter') addRule('Poorattadhi: Star Lord Jupiter', 6, 'both', false, 'பூரட்டாதி: நட்சத்திர அதிபதி குரு');
            break;
        case 'Uttara Bhadrapada':
        case 'Uthirattadhi':
            if (playerRasiLord === 'Saturn') addRule('Uthirattadhi: Rasi Lord Saturn', 5, 'both', false, 'உத்திரட்டாதி: ராசி அதிபதி சனி');
            break;
        case 'Revati':
            if (playerStarLord === 'Mercury') addRule('Revati: Star Lord Mercury', 6, 'both', false, 'ரேவதி: நட்சத்திர அதிபதி புதன்');
            break;
    }

    return { batting, bowling };
}

export function evaluateBatsman(player, match, transit = {}) {
    const { batting } = getPrediction(player, match, transit);
    return batting;
}

export function evaluateBowler(player, match, transit = {}) {
    const { bowling } = getPrediction(player, match, transit);
    return bowling;
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
