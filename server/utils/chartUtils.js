const planetTamilMap = {
    'Sun': 'சூரியன்', 'Moon': 'சந்திரன்', 'Mars': 'செவ்வாய்', 'Mercury': 'புதன்',
    'Jupiter': 'குரு', 'Venus': 'சுக்கிரன்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது',
    'Asc': 'லக்னம்', 'Lagna': 'லக்னம்', 'Uranus': 'யுரேனஸ்', 'Neptune': 'நெப்டியூன்', 'Pluto': 'புளூட்டோ'
};

const dignityTamilMap = {
    'Exalted': 'உச்சம்', 'Debilitated': 'நீசம்', 'Own Sign': 'ஆட்சி',
    'Friendly': 'நட்பு', 'Neutral': 'சமம்', 'Enemy': 'பகை', 'Great Enemy': 'தீவிர பகை', 'Great Friend': 'உற்ற நண்பன்'
};

const getNakshatraLordHelper = (nakshatraName) => {
    if (!nakshatraName) return '-';
    // Simplified map for shared use
    const lordMap = {
        'Ashwini': 'Ketu', 'Bharani': 'Venus', 'Krittika': 'Sun',
        'Rohini': 'Moon', 'Mrigashirsha': 'Mars', 'Ardra': 'Rahu',
        'Punarvasu': 'Jupiter', 'Pushya': 'Saturn', 'Ashlesha': 'Mercury',
        'Magha': 'Ketu', 'Purva Phalguni': 'Venus', 'Uttara Phalguni': 'Sun',
        'Hasta': 'Moon', 'Chitra': 'Mars', 'Swati': 'Rahu',
        'Vishakha': 'Jupiter', 'Anuradha': 'Saturn', 'Jyeshtha': 'Mercury',
        'Mula': 'Ketu', 'Purva Ashadha': 'Venus', 'Uttara Ashadha': 'Sun',
        'Shravana': 'Moon', 'Dhanishta': 'Mars', 'Shatabhisha': 'Rahu',
        'Purva Bhadrapada': 'Jupiter', 'Uttara Bhadrapada': 'Saturn', 'Revati': 'Mercury'
    };
    for (const [key, val] of Object.entries(lordMap)) {
        if (nakshatraName.includes(key)) return val;
    }
    return '-';
};

const oddSigns = new Set(['Aries', 'Gemini', 'Leo', 'Libra', 'Sagittarius', 'Aquarius']);

const calculateAvastha = (signName, degree) => {
    if (!signName || degree === undefined || degree === null) return { english: '-', tamil: '-' };

    // Normalize sign name check
    const isOdd = oddSigns.has(signName) || oddSigns.has(signName.split(' ')[0]); // Handle cases like "Aries (Mesha)" if any

    // Baaladi Avasthas based on degree
    // Odd: 0-6 Infant, 6-12 Adolescent, 12-18 Youth, 18-24 Old, 24-30 Dead
    // Even: 0-6 Dead, 6-12 Old, 12-18 Youth, 18-24 Adolescent, 24-30 Infant

    let state = '';

    if (isOdd) {
        if (degree < 6) state = 'Infant';
        else if (degree < 12) state = 'Adolescent';
        else if (degree < 18) state = 'Youth';
        else if (degree < 24) state = 'Old';
        else state = 'Dead';
    } else {
        if (degree < 6) state = 'Dead';
        else if (degree < 12) state = 'Old';
        else if (degree < 18) state = 'Youth';
        else if (degree < 24) state = 'Adolescent';
        else state = 'Infant';
    }

    const avasthaTamilMap = {
        'Infant': 'பாலிய',    // Balya
        'Adolescent': 'குமார', // Kumara
        'Youth': 'யுவ',      // Yuva
        'Old': 'விருத்த',   // Vriddha
        'Dead': 'மிருத'      // Mrita
    };

    return {
        english: state,
        tamil: avasthaTamilMap[state] || state
    };
};

const { calculateSign, calculateNakshatra, calculateDignity, formatDegree } = require('./astroCalculator');

const processSinglePlanet = (pRaw, houseContext) => {
    const pName = typeof pRaw === 'string' ? pRaw : (pRaw.name || pRaw.englishName);
    if (!pName) return null;

    // Direct Props from API or House Context
    let signName = (houseContext && houseContext.sign) || (typeof pRaw === 'object' ? (pRaw.sign?.name || pRaw.sign) : null);
    let signTamil = (houseContext && houseContext.signTamil) || (typeof pRaw === 'object' ? pRaw.signTamil : null);
    let lordName = (houseContext && houseContext.lord) || (typeof pRaw === 'object' ? (pRaw.lord?.name || pRaw.lord) : null);
    let lordTamil = (houseContext && houseContext.lordTamil) || (typeof pRaw === 'object' ? pRaw.lordTamil : null);

    let nakshatraName = (typeof pRaw === 'object' ? (pRaw.nakshatra?.name || pRaw.nakshatra) : null);
    let nakshatraTamil = (typeof pRaw === 'object' ? pRaw.nakshatraTamil : null);
    let nakLord = (typeof pRaw === 'object' ? pRaw.nakshatraLord : null);
    let pada = (typeof pRaw === 'object' ? pRaw.pada : null);

    let degreeVal = (typeof pRaw === 'object' && pRaw.degree !== undefined) ? parseFloat(pRaw.degree) : 0;

    // --- NATIVE CALCULATION FALLBACK ---
    // If degree is present but other details are missing, calculate them
    if (degreeVal > 0 && (!signName || !nakshatraName)) {
        // Calculate Sign Details
        const signCalc = calculateSign(degreeVal);
        if (!signName) {
            signName = signCalc.name;
            signTamil = signCalc.tamil;
            lordName = signCalc.lord;
            lordTamil = signCalc.lordTamil;
        }

        // Calculate Nakshatra Details
        const nakCalc = calculateNakshatra(degreeVal);
        if (!nakshatraName) {
            nakshatraName = nakCalc.name;
            nakshatraTamil = nakCalc.tamil;
            nakLord = nakCalc.lord;
            pada = nakCalc.pada;
        }
    }

    // Ensure Nakshatra Lord is populated
    if (!nakLord && nakshatraName) {
        nakLord = getNakshatraLordHelper(nakshatraName);
    }

    const degreeStr = !isNaN(degreeVal) && degreeVal > 0 ? formatDegree(degreeVal) : '-';

    let dignityEnglish = (typeof pRaw === 'object' ? (pRaw.dignity?.english || pRaw.dignity) : null);
    let dignityTamil = dignityEnglish ? (dignityTamilMap[dignityEnglish] || dignityEnglish) : null;

    // Calculate Dignity if missing
    if (!dignityEnglish && degreeVal > 0) {
        const digCalc = calculateDignity(pName, degreeVal);
        dignityEnglish = digCalc.english;
        dignityTamil = digCalc.tamil;
    }

    // Determine values with defaults for display
    signName = signName || '-';
    signTamil = signTamil || '-';
    lordName = lordName || '-';
    lordTamil = lordTamil || '-';
    nakshatraName = nakshatraName || '-';
    nakshatraTamil = nakshatraTamil || '-';

    // Calculate Avastha
    const avastha = calculateAvastha(signName, degreeVal);

    // Calculate State (Retrograde/Direct)
    const isRetro = (typeof pRaw === 'object' ? pRaw.isRetro : false);
    const stateEnglish = isRetro ? 'Retrograde' : 'Direct';
    const stateTamil = isRetro ? 'வக்ரம்' : 'நேர்கதி'; // Vakram : Nerkathi

    const nakLordName = nakLord || '-';
    return {
        planetName: pName,
        planetTamil: planetTamilMap[pName] || pName,
        signName,
        signTamil,
        lordName,
        lordTamil,
        nakshatraName: nakshatraName || '-',
        nakshatraTamil,
        pada: pada || '-',
        nakshatraLord: nakLordName,
        nakshatraLordTamil: planetTamilMap[nakLordName] || nakLordName,
        degreeFormatted: degreeStr,
        dignityName: dignityEnglish || '-',
        dignityTamil: dignityTamil || '-',
        avasthaName: avastha.english,
        avasthaTamil: avastha.tamil,
        isRetro: isRetro,
        stateName: stateEnglish,
        stateTamil: stateTamil,
        isCombust: (typeof pRaw === 'object' ? pRaw.isCombust : false),
        raw: pRaw // Keep raw for debug if needed
    };
};

const formatPlanetaryData = (rawPlanets) => {
    const planetList = [];
    if (!rawPlanets) return planetList;

    // 1. Explicitly Handle Array Input (e.g., list of planets or list of houses)
    if (Array.isArray(rawPlanets)) {
        rawPlanets.forEach(p => {
            // Check if this item is a house containing planets array, or just a planet
            const nested = p.planets || p.Planets || (Array.isArray(p) ? p : null);
            if (nested && Array.isArray(nested)) {
                nested.forEach(sp => {
                    const obj = processSinglePlanet(sp, p);
                    if (obj) planetList.push(obj);
                });
            } else if (p.name || p.planet) {
                // It's a planet object
                const obj = processSinglePlanet(p, null);
                if (obj) planetList.push(obj);
            }
        });
        return planetList;
    }

    // 2. Handle Object structure (Map of planets or Map of houses)
    const keys = Object.keys(rawPlanets);
    const isHouseData = keys.some(k => !isNaN(parseInt(k)) && typeof rawPlanets[k] === 'object');

    if (isHouseData) {
        Object.values(rawPlanets).forEach(house => {
            let planets = [];
            if (Array.isArray(house)) {
                planets = house;
            } else if (house.planets) {
                planets = Array.isArray(house.planets) ? house.planets : Object.values(house.planets);
            } else if (house.Planets) {
                planets = Array.isArray(house.Planets) ? house.Planets : Object.values(house.Planets);
            }

            if (planets.length > 0) {
                planets.forEach(pRaw => {
                    const obj = processSinglePlanet(pRaw, house);
                    if (obj) planetList.push(obj);
                });
            }
        });
    } else {
        Object.values(rawPlanets).forEach(pRaw => {
            const obj = processSinglePlanet(pRaw, null);
            if (obj) planetList.push(obj);
        });
    }
    return planetList;
};

module.exports = { formatPlanetaryData };
