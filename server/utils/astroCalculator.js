const SIGNS = [
    { id: 1, name: 'Aries', tamil: 'மேஷம்', lord: 'Mars', lordTamil: 'செவ்வாய்' },
    { id: 2, name: 'Taurus', tamil: 'ரிஷபம்', lord: 'Venus', lordTamil: 'சுக்கிரன்' },
    { id: 3, name: 'Gemini', tamil: 'மிதுனம்', lord: 'Mercury', lordTamil: 'புதன்' },
    { id: 4, name: 'Cancer', tamil: 'கடகம்', lord: 'Moon', lordTamil: 'சந்திரன்' },
    { id: 5, name: 'Leo', tamil: 'சிம்மம்', lord: 'Sun', lordTamil: 'சூரியன்' },
    { id: 6, name: 'Virgo', tamil: 'கன்னி', lord: 'Mercury', lordTamil: 'புதன்' },
    { id: 7, name: 'Libra', tamil: 'துலாம்', lord: 'Venus', lordTamil: 'சுக்கிரன்' },
    { id: 8, name: 'Scorpio', tamil: 'விருச்சிகம்', lord: 'Mars', lordTamil: 'செவ்வாய்' },
    { id: 9, name: 'Sagittarius', tamil: 'தனுசு', lord: 'Jupiter', lordTamil: 'குரு' },
    { id: 10, name: 'Capricorn', tamil: 'மகரம்', lord: 'Saturn', lordTamil: 'சனி' },
    { id: 11, name: 'Aquarius', tamil: 'கும்பம்', lord: 'Saturn', lordTamil: 'சனி' },
    { id: 12, name: 'Pisces', tamil: 'மீனம்', lord: 'Jupiter', lordTamil: 'குரு' }
];

const NAKSHATRAS = [
    { name: 'Ashwini', tamil: 'அஸ்வினி', lord: 'Ketu' },
    { name: 'Bharani', tamil: 'பரணி', lord: 'Venus' },
    { name: 'Krittika', tamil: 'கார்த்திகை', lord: 'Sun' },
    { name: 'Rohini', tamil: 'ரோகிணி', lord: 'Moon' },
    { name: 'Mrigashirsha', tamil: 'மிருகசீரிஷம்', lord: 'Mars' },
    { name: 'Ardra', tamil: 'திருவாதிரை', lord: 'Rahu' },
    { name: 'Punarvasu', tamil: 'புனர்பூசம்', lord: 'Jupiter' },
    { name: 'Pushya', tamil: 'பூசம்', lord: 'Saturn' },
    { name: 'Ashlesha', tamil: 'ஆயில்யம்', lord: 'Mercury' },
    { name: 'Magha', tamil: 'மகம்', lord: 'Ketu' },
    { name: 'Purva Phalguni', tamil: 'பூரம்', lord: 'Venus' },
    { name: 'Uttara Phalguni', tamil: 'உத்திரம்', lord: 'Sun' },
    { name: 'Hasta', tamil: 'ஹஸ்தம்', lord: 'Moon' },
    { name: 'Chitra', tamil: 'சித்திரை', lord: 'Mars' },
    { name: 'Swati', tamil: 'சுவாதி', lord: 'Rahu' },
    { name: 'Vishakha', tamil: 'விசாகம்', lord: 'Jupiter' },
    { name: 'Anuradha', tamil: 'அனுஷம்', lord: 'Saturn' },
    { name: 'Jyeshtha', tamil: 'கேட்டை', lord: 'Mercury' },
    { name: 'Mula', tamil: 'மூலம்', lord: 'Ketu' },
    { name: 'Purva Ashadha', tamil: 'பூராடம்', lord: 'Venus' },
    { name: 'Uttara Ashadha', tamil: 'உத்திராடம்', lord: 'Sun' },
    { name: 'Shravana', tamil: 'திருவோணம்', lord: 'Moon' },
    { name: 'Dhanishta', tamil: 'அவிட்டம்', lord: 'Mars' },
    { name: 'Shatabhisha', tamil: 'சதயம்', lord: 'Rahu' },
    { name: 'Purva Bhadrapada', tamil: 'பூரட்டாதி', lord: 'Jupiter' },
    { name: 'Uttara Bhadrapada', tamil: 'உத்திரட்டாதி', lord: 'Saturn' },
    { name: 'Revati', tamil: 'ரேவதி', lord: 'Mercury' }
];



// Planet Info for Dignity Calculations
// Exalted (Ucha), Mooltrikona, Debilitated (Neecha), Own (Aatchi)
const PLANET_INFO = {
    'Sun': { exalted: 1, mool: 5, debilitated: 7, own: [5], friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'], neutral: ['Mercury'] },
    'Moon': { exalted: 2, mool: 2, debilitated: 8, own: [4], friends: ['Sun', 'Mercury'], enemies: [], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
    'Mars': { exalted: 10, mool: 1, debilitated: 4, own: [1, 8], friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutral: ['Venus', 'Saturn'] },
    'Mercury': { exalted: 6, mool: 6, debilitated: 12, own: [3, 6], friends: ['Sun', 'Venus'], enemies: ['Moon'], neutral: ['Mars', 'Jupiter', 'Saturn'] },
    'Jupiter': { exalted: 4, mool: 9, debilitated: 10, own: [9, 12], friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'], neutral: ['Saturn'] },
    'Venus': { exalted: 12, mool: 7, debilitated: 6, own: [2, 7], friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'], neutral: ['Mars', 'Jupiter'] },
    'Saturn': { exalted: 7, mool: 11, debilitated: 1, own: [10, 11], friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'], neutral: ['Jupiter'] },
    'Rahu': { exalted: [2], mool: null, debilitated: [8], own: [], friends: ['Venus', 'Saturn'], enemies: ['Sun', 'Moon', 'Mars'], neutral: ['Mercury', 'Jupiter'] },
    'Ketu': { exalted: [8], mool: null, debilitated: [2], own: [], friends: ['Mars', 'Venus'], enemies: ['Sun', 'Moon', 'Saturn'], neutral: ['Mercury', 'Jupiter'] }
};

// Dignity Colors for UI
const DIGNITY_COLORS = {
    'Exalted': { color: '#006400', colorName: 'Dark Green' },       // உச்சம்
    'Mooltrikona': { color: '#228B22', colorName: '80% Green' },    // மூலதிரிகோணம்
    'Own Sign': { color: '#32CD32', colorName: '70% Green' },       // ஆட்சி
    'Debilitated': { color: '#DC143C', colorName: 'Red' },          // நீசம்
    'Friendly': { color: '#4169E1', colorName: 'Blue' },            // நட்பு
    'Enemy': { color: '#FF8C00', colorName: 'Orange' },             // பகை
    'Neutral': { color: '#708090', colorName: 'Gray' }              // சமம்
};

/**
 * Calculate Zodiac Sign from Longitude (0-360)
 */
const calculateSign = (longitude) => {
    let normalized = parseFloat(longitude) % 360;
    if (normalized < 0) normalized += 360;

    // Each sign is 30 degrees
    const signIndex = Math.floor(normalized / 30);
    const signObj = SIGNS[signIndex];
    const degreesInSign = normalized % 30;

    return {
        ...signObj,
        degreesInSign: degreesInSign,
        totalLongitude: normalized
    };
};

/**
 * Calculate Nakshatra from Longitude (0-360)
 */
const calculateNakshatra = (longitude) => {
    let normalized = parseFloat(longitude) % 360;
    if (normalized < 0) normalized += 360;

    // Each Nakshatra is 13 degrees 20 minutes = 13.333333... degrees
    const nakshatraSpan = 360 / 27; // 13.3333
    const nakIndex = Math.floor(normalized / nakshatraSpan);
    const nakObj = NAKSHATRAS[nakIndex];

    // Calculate Pada (Quarter)
    // Each Pada is 3 degrees 20 minutes = 3.3333 degrees
    // There are 4 Padas per Nakshatra
    const degreesInNak = normalized % nakshatraSpan;
    const padaSpan = nakshatraSpan / 4;
    const pada = Math.floor(degreesInNak / padaSpan) + 1;

    return {
        ...nakObj,
        pada: pada,
        degreesInNak: degreesInNak
    };
};

/**
 * Calculate Planet Dignity (Exalted, Mooltrikona, Own, etc.) with colors
 */
const calculateDignity = (planetName, longitude) => {
    const defaultResult = {
        english: 'Neutral', tamil: 'சமம்',
        color: DIGNITY_COLORS['Neutral'].color,
        colorName: DIGNITY_COLORS['Neutral'].colorName
    };

    if (!planetName || !PLANET_INFO[planetName]) return defaultResult;

    const signData = calculateSign(longitude);
    const signId = signData.id;
    const degreesInSign = signData.degreesInSign;
    const info = PLANET_INFO[planetName];

    // Check Exalted (highest priority)
    if (Array.isArray(info.exalted)) {
        if (info.exalted.includes(signId)) {
            return { english: 'Exalted', tamil: 'உச்சம்', ...DIGNITY_COLORS['Exalted'] };
        }
    } else if (info.exalted === signId) {
        return { english: 'Exalted', tamil: 'உச்சம்', ...DIGNITY_COLORS['Exalted'] };
    }

    // Check Debilitated
    if (Array.isArray(info.debilitated)) {
        if (info.debilitated.includes(signId)) {
            return { english: 'Debilitated', tamil: 'நீசம்', ...DIGNITY_COLORS['Debilitated'] };
        }
    } else if (info.debilitated === signId) {
        return { english: 'Debilitated', tamil: 'நீசம்', ...DIGNITY_COLORS['Debilitated'] };
    }

    // Check Mooltrikona (specific degree ranges in the sign)
    // Mooltrikona applies in specific portions of the sign
    if (info.mool && info.mool === signId) {
        // Mooltrikona degree ranges (simplified - first 20 degrees usually)
        if (degreesInSign <= 20) {
            return { english: 'Mooltrikona', tamil: 'மூலதிரிகோணம்', ...DIGNITY_COLORS['Mooltrikona'] };
        }
    }

    // Check Own Sign
    if (info.own.includes(signId)) {
        return { english: 'Own Sign', tamil: 'ஆட்சி', ...DIGNITY_COLORS['Own Sign'] };
    }

    // Check Friend/Enemy based on Sign Lord
    const signLord = signData.lord;
    if (info.friends.includes(signLord)) {
        return { english: 'Friendly', tamil: 'நட்பு', ...DIGNITY_COLORS['Friendly'] };
    }
    if (info.enemies.includes(signLord)) {
        return { english: 'Enemy', tamil: 'பகை', ...DIGNITY_COLORS['Enemy'] };
    }

    return defaultResult;
};

/**
 * Format decimal degrees to string (e.g. 15.5 -> 15° 30')
 */
const formatDegree = (vals) => {
    const val = parseFloat(vals);
    if (isNaN(val)) return '0° 0\'';

    const deg = Math.floor(val);
    const mins = Math.floor((val - deg) * 60);
    return `${deg}° ${mins}'`;
};

// Simplified planetary position calculation (approximation)
const calculatePlanetaryPositions = (year, month, day, hour, minute, latitude, longitude, timezone) => {
    // Julian Day calculation
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const jdTime = jd + (hour + minute / 60 - timezone) / 24;

    // Days from J2000.0 epoch (Jan 1, 2000 12:00 TT)
    const d = jdTime - 2451545.0;

    // Simplified planetary longitude calculations (tropical)
    // These are approximations suitable for astrological purposes
    const sunMeanLong = (280.46 + 0.9856474 * d) % 360;
    const sunAnomaly = (357.528 + 0.9856003 * d) % 360;
    const sunLong = (sunMeanLong + 1.915 * Math.sin(sunAnomaly * Math.PI / 180) + 0.020 * Math.sin(2 * sunAnomaly * Math.PI / 180)) % 360;

    // Moon (simplified - actual calculation is complex)
    const moonMeanLong = (218.32 + 13.176396 * d) % 360;
    const moonAnomaly = (134.9 + 13.064993 * d) % 360;
    const moonLong = (moonMeanLong + 6.29 * Math.sin(moonAnomaly * Math.PI / 180)) % 360;

    // --- AYANAMSA CORRECTION (Tropical -> Sidereal/Nirayana) ---
    // Lahiri Ayanamsa Calculation (Approximate)
    const ayanamsaBase = 23.85;
    const yearsSince2000 = (year + (month - 1) / 12 + day / 365) - 2000;
    const ayanamsa = ayanamsaBase + (yearsSince2000 * 0.01397);

    // Helper to normalize 0-360
    const toSidereal = (tropicalVal) => {
        let siderealVal = (tropicalVal - ayanamsa) % 360;
        if (siderealVal < 0) siderealVal += 360;
        return siderealVal;
    };

    // Planets (Sidereal)
    const planets = {
        Sun: toSidereal((sunLong + 360) % 360),
        Moon: toSidereal((moonLong + 360) % 360),
        Mars: toSidereal((355.45 + 0.5240208 * d + 360) % 360),
        Mercury: toSidereal((48.33 + 4.0923344 * d + 360) % 360),
        Jupiter: toSidereal((34.40 + 0.0830853 * d + 360) % 360),
        Venus: toSidereal((181.98 + 1.6021302 * d + 360) % 360),
        Saturn: toSidereal((50.08 + 0.0334442 * d + 360) % 360),
        Rahu: toSidereal((125.04 - 0.0529539 * d + 360) % 360), // True Rahu approx
    };
    planets.Ketu = (planets.Rahu + 180) % 360;

    // Ascendant (Lagna) - Tropical then Sidereal
    const lst = (100.46 + 0.985647 * d + longitude + (hour + minute / 60) * 15) % 360;
    const ascendantTropical = (lst + 360) % 360;
    const ascendant = toSidereal(ascendantTropical);

    return { planets, ascendant, ayanamsaVal: ayanamsa };
};

module.exports = {
    SIGNS,
    NAKSHATRAS,
    PLANET_INFO,
    DIGNITY_COLORS,
    calculateSign,
    calculateNakshatra,
    calculateDignity,
    calculatePlanetaryPositions,
    formatDegree
};
