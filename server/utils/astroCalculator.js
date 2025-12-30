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

    // --- KEPLERIAN ORBITAL ELEMENTS (J2000.0) ---
    // Source: Paul Schlyter / JPL Approx
    // N = Long Asc Node, i = Inclination, w = Arg Perihelion, a = Semi-major axis, e = Eccentricity, M = Mean Anomaly

    // Helper trig (degrees)
    const sin = (deg) => Math.sin(deg * Math.PI / 180);
    const cos = (deg) => Math.cos(deg * Math.PI / 180);
    const tan = (deg) => Math.tan(deg * Math.PI / 180);
    const atan2 = (y, x) => Math.atan2(y, x) * 180 / Math.PI;
    const asin = (x) => Math.asin(x) * 180 / Math.PI;

    const normalize = (ang) => {
        let r = ang % 360;
        return r < 0 ? r + 360 : r;
    };

    // 1. SUN (Base for Geocentric)
    const M_sun = normalize(357.5291 + 0.98560028 * d);
    const L_sun_mean = normalize(280.4665 + 0.98564736 * d);
    // Sun Eq of Center
    const C_sun = (1.9148 - 0.004817 * 0) * sin(M_sun) + 0.0200 * sin(2 * M_sun);
    const L_sun_true = normalize(L_sun_mean + C_sun);
    const R_sun = 1.00014 - 0.01671 * cos(M_sun) - 0.00014 * cos(2 * M_sun); // Earth-Sun Distance

    // Earth's Helicoords (opposite to Sun)
    const L_earth = normalize(L_sun_true + 180);
    // Earth coords X,Y,Z
    const Xe = R_sun * cos(L_earth);
    const Ye = R_sun * sin(L_earth);
    const Ze = 0; // Earth in ecliptic plane (approx)

    // Helper to solve Kepler Eq: M = E - e*sin(E)
    // Returns degrees
    const solveKepler = (M, e) => {
        let E = M; // Initial guess
        const M_rad = M * Math.PI / 180;
        // Iterate
        for (let k = 0; k < 10; k++) {
            let dE = (M_rad - (E * Math.PI / 180 - e * sin(E))) / (1 - e * cos(E));
            E += dE * 180 / Math.PI;
            if (Math.abs(dE) < 1e-6) break;
        }
        return E;
    };

    // CALCULATE PLANET (Heliocentric -> Geocentric)
    const calcPlanet = (N0, Nd, i0, id, w0, wd, a, e0, ed, M0, Md, name) => {
        const N = normalize(N0 + Nd * d);
        const i = i0 + id * d;
        const w = normalize(w0 + wd * d);
        const e = e0 + ed * d;
        const M = normalize(M0 + Md * d);

        // Eccentric Anomaly
        const E = solveKepler(M, e);

        // Heliocentric coords in orbital plane
        // x = a(cosE - e), y = a*sqrt(1-e^2)*sinE
        const xv = a * (cos(E) - e);
        const yv = a * Math.sqrt(1 - e * e) * sin(E);

        const v = atan2(yv, xv); // True Anomaly
        const r = Math.sqrt(xv * xv + yv * yv); // Distance to Sun

        // Project to Ecliptic
        // xh = r * (cos(N) cos(v+w) - sin(N) sin(v+w) cos(i))
        // yh = r * (sin(N) cos(v+w) + cos(N) sin(v+w) cos(i))
        // zh = r * (sin(v+w) sin(i))
        const u = v + w; // Argument of Latitude
        const xh = r * (cos(N) * cos(u) - sin(N) * sin(u) * cos(i));
        const yh = r * (sin(N) * cos(u) + cos(N) * sin(u) * cos(i));
        const zh = r * (sin(u) * sin(i));

        // Geocentric Coords
        const xg = xh + Xe;
        const yg = yh + Ye;
        const zg = zh + Ze;

        // Geocentric Longitude & Latitude
        const long = normalize(atan2(yg, xg));
        return long;
    };

    // MERCURY
    const mercuryLong = calcPlanet(48.3313, 3.24587E-5, 7.0047, 5.00E-8, 29.1241, 1.01444E-5, 0.387098, 0.205635, 5.59E-10, 168.6562, 4.0923344368, 'Mercury');
    // VENUS
    const venusLong = calcPlanet(76.6799, 2.46590E-5, 3.3946, 2.75E-8, 54.8910, 1.38374E-5, 0.723330, 0.006773, -1.30E-9, 48.0052, 1.6021302244, 'Venus');
    // MARS
    const marsLong = calcPlanet(49.5574, 2.11081E-5, 1.8497, -1.78E-8, 286.5016, 2.92961E-5, 1.523688, 0.093405, 2.51E-9, 18.6021, 0.5240207766, 'Mars');
    // JUPITER
    const jupiterLong = calcPlanet(100.4542, 2.76854E-5, 1.3030, -1.557E-7, 273.8777, 1.64505E-5, 5.20256, 0.048498, 4.469E-9, 19.8950, 0.0830853001, 'Jupiter');
    // SATURN
    const saturnLong = calcPlanet(113.6634, 2.38980E-5, 2.4854, -3.27E-8, 339.3923, 2.97661E-5, 9.55475, 0.055546, -9.499E-9, 316.9670, 0.0334442282, 'Saturn');

    // MOON (Reusing previous sufficient approx with corrections)
    const L_moon_mean = normalize(218.316 + 13.176396 * d);
    const M_moon = normalize(134.963 + 13.064993 * d);
    const F_moon = normalize(93.272 + 13.229350 * d);
    const L_moon_raw = L_moon_mean + 6.289 * sin(M_moon);
    const L_moon_corr = L_moon_raw
        - 1.274 * sin(M_moon - 2 * (L_sun_mean - L_moon_mean)) // Evection
        + 0.658 * sin(2 * (L_moon_mean - L_sun_mean)) // Variation
        - 0.185 * sin(M_sun) // Annual Eq
        - 0.114 * sin(2 * F_moon); // Reduction
    const moonLong = normalize(L_moon_corr);

    // RAHU (Mean Node)
    // N = 125.04452 - 1934.136261 * T (T=d/36525) -> d * 0.05295
    const rahuMean = normalize(125.0445 - 0.0529539 * d);

    // --- AYANAMSA CORRECTION (Tropical -> Sidereal/Nirayana) ---
    // Lahiri Ayanamsa Calculation
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
        Sun: toSidereal(L_sun_true),
        Moon: toSidereal(moonLong),
        Mars: toSidereal(marsLong),
        Mercury: toSidereal(mercuryLong),
        Jupiter: toSidereal(jupiterLong),
        Venus: toSidereal(venusLong),
        Saturn: toSidereal(saturnLong),
        Rahu: toSidereal(rahuMean),
    };
    planets.Ketu = (planets.Rahu + 180) % 360;

    // Ascendant (Lagna)
    // Using simple LST logic (could be improved but acceptable for now)
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
