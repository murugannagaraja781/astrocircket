/**
 * KP Astrology High-Precision Calculation Engine
 */

const VIMSHOTTARI_RATIOS = {
    'Ketu': 7,
    'Venus': 20,
    'Sun': 6,
    'Moon': 10,
    'Mars': 7,
    'Rahu': 18,
    'Jupiter': 16,
    'Saturn': 19,
    'Mercury': 17
};

const VIMSHOTTARI_ORDER = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
];

const NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
    'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const TOTAL_DASA_YEARS = 120;
const NAKSHATRA_SPAN_MINUTES = 800; // 13°20'
const EPSILON_ARC_SEC = 0.01; // 0.01 arc-second tolerance
const EPSILON_DEG = EPSILON_ARC_SEC / 3600;

/**
 * Get Sub Lord and other details for a given longitude
 */
const getKPSubDetails = (longitude) => {
    let normalized = (longitude % 360 + 360) % 360;

    // Sign
    const signIndex = Math.floor(normalized / 30);
    const signName = SIGNS[signIndex];

    // Nakshatra
    const nakIndex = Math.floor(normalized / (13 + 1 / 3));
    const nakName = NAKSHATRAS[nakIndex];
    const nakLord = VIMSHOTTARI_ORDER[nakIndex % 9];

    // Sub Division
    const degreesInNak = normalized % (13 + 1 / 3);
    const minutesInNak = degreesInNak * 60;

    // Calculate Subs in this Nakshatra
    let currentOffset = 0;
    let subLord = null;
    let subDurationMinutes = 0;
    let subEndArc = 0;

    // The sub-lords start from the Nakshatra lord itself
    const startLordIndex = VIMSHOTTARI_ORDER.indexOf(nakLord);

    for (let i = 0; i < 9; i++) {
        const currentLord = VIMSHOTTARI_ORDER[(startLordIndex + i) % 9];
        const subArc = NAKSHATRA_SPAN_MINUTES * (VIMSHOTTARI_RATIOS[currentLord] / TOTAL_DASA_YEARS);

        // Use epsilon for boundary check
        if (minutesInNak >= (currentOffset - EPSILON_ARC_SEC / 60) && minutesInNak < (currentOffset + subArc - EPSILON_ARC_SEC / 60)) {
            subLord = currentLord;
            subDurationMinutes = subArc;
            subEndArc = (nakIndex * NAKSHATRA_SPAN_MINUTES) + currentOffset + subArc;
            break;
        }
        currentOffset += subArc;
    }

    // Fallback if loop ends (precision issue)
    if (!subLord) {
        const lastLord = VIMSHOTTARI_ORDER[(startLordIndex + 8) % 9];
        subLord = lastLord;
        subDurationMinutes = NAKSHATRA_SPAN_MINUTES * (VIMSHOTTARI_RATIOS[lastLord] / TOTAL_DASA_YEARS);
        subEndArc = (nakIndex + 1) * NAKSHATRA_SPAN_MINUTES;
    }

    return {
        sign: signName,
        nakshatra: nakName,
        nakLord: nakLord,
        subLord: subLord,
        subEndArc: subEndArc / 60, // Convert back to degrees for easier comparison
        currentArc: normalized
    };
};

/**
 * Calculate Lagna Speed (arc-seconds per second)
 * Formula: 15 * cos(latitude) / cos(declination)
 */
const getLagnaSpeed = (latitude, eclipticLongitude) => {
    const latRad = (latitude * Math.PI) / 180;
    const eclipticRad = (eclipticLongitude * Math.PI) / 180;
    const obliquity = (23.439291 * Math.PI) / 180;

    // Declination = asin( sin(ecliptic_long) * sin(obliquity) )
    const declinationRad = Math.asin(Math.sin(eclipticRad) * Math.sin(obliquity));

    // Speed in arc-seconds per second
    const speed = (15.041 * Math.cos(latRad)) / Math.cos(declinationRad); // Use 15.041 for better sidereal accuracy
    return speed;
};

/**
 * Generate 24-hour timeline jumping by Sub boundaries
 */
const generateKPTimeline = (startTime, latitude, longitude, timezone, ayanamsaValue) => {
    const timeline = [];
    let currentTimeMs = new Date(startTime).getTime();
    const endTimeMs = currentTimeMs + 24 * 60 * 60 * 1000;

    // Helper to get JD for a given time
    const getJD = (ms) => (ms / 86400000) + 2440587.5;

    // Obliquity constant
    const obliquityRad = (23.439291 * Math.PI) / 180;

    while (currentTimeMs < endTimeMs) {
        const jd = getJD(currentTimeMs);

        // Calculate Sidereal Time (RAMC)
        const gmst = (280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360;
        const lst = (gmst + longitude) % 360;
        const ramcRad = (lst * Math.PI) / 180;
        const latRad = (latitude * Math.PI) / 180;

        // Tropical Ascendant (Lagna)
        const ascRad = Math.atan2(
            Math.cos(ramcRad),
            -Math.sin(ramcRad) * Math.cos(obliquityRad) - Math.tan(latRad) * Math.sin(obliquityRad)
        );
        let tropicalLagna = (ascRad * 180) / Math.PI;
        if (tropicalLagna < 0) tropicalLagna += 360;

        // Sidereal Lagna
        let siderealLagna = (tropicalLagna - ayanamsaValue) % 360;
        if (siderealLagna < 0) siderealLagna += 360;

        const details = getKPSubDetails(siderealLagna);
        const speed = getLagnaSpeed(latitude, tropicalLagna);

        // Calculate remaining degrees to next sub boundary
        let remainingDegrees = details.subEndArc - siderealLagna;

        // If we are already AT or slightly past the boundary, skip to next
        if (remainingDegrees <= EPSILON_DEG) {
            remainingDegrees = EPSILON_DEG * 10; // Miniature jump to cross boundary
        }

        // seconds = (degrees * 3600) / speed
        let secondsToJump = (remainingDegrees * 3600) / speed;

        // HARD MINIMUM: Always progress at least 1 second to avoid loops
        if (secondsToJump < 1) secondsToJump = 1;

        const nextTimeMs = Math.min(currentTimeMs + Math.round(secondsToJump) * 1000, endTimeMs);

        // Skip adding if duration is effectively zero
        if (nextTimeMs > currentTimeMs) {
            timeline.push({
                from: new Date(currentTimeMs).toISOString(),
                to: new Date(nextTimeMs).toISOString(),
                sign: details.sign,
                nakshatra: details.nakshatra,
                subLord: details.subLord,
                durationSeconds: Math.round((nextTimeMs - currentTimeMs) / 1000),
                lagna: siderealLagna.toFixed(6)
            });
        }

        currentTimeMs = nextTimeMs;

        // Safety break
        if (timeline.length > 1000) break;
    }

    // Post-process: Merge rows with same Sub Lord to avoid micro-segments
    const mergedTimeline = [];
    if (timeline.length > 0) {
        let current = { ...timeline[0] };
        for (let i = 1; i < timeline.length; i++) {
            const next = timeline[i];
            // Merge if same sub lord AND duration is small OR consecutive
            if (next.subLord === current.subLord && next.nakshatra === current.nakshatra) {
                current.to = next.to;
                current.durationSeconds += next.durationSeconds;
            } else {
                mergedTimeline.push(current);
                current = { ...next };
            }
        }
        mergedTimeline.push(current);
    }

    return mergedTimeline;
};

module.exports = {
    getKPSubDetails,
    getLagnaSpeed,
    generateKPTimeline
};
