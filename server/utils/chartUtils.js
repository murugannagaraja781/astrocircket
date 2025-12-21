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

const processSinglePlanet = (pRaw, houseContext) => {
    const pName = typeof pRaw === 'string' ? pRaw : (pRaw.name || pRaw.englishName);
    if (!pName) return null;

    // Use house context if available, otherwise direct properties
    const signName = (houseContext && houseContext.sign) || (typeof pRaw === 'object' ? (pRaw.sign?.name || pRaw.sign) : null) || '-';
    const signTamil = (houseContext && houseContext.signTamil) || (typeof pRaw === 'object' ? pRaw.signTamil : null) || '-';
    const lordName = (houseContext && houseContext.lord) || (typeof pRaw === 'object' ? (pRaw.lord?.name || pRaw.lord) : null) || '-';
    const lordTamil = (houseContext && houseContext.lordTamil) || (typeof pRaw === 'object' ? pRaw.lordTamil : null) || '-';

    const nakshatraName = (typeof pRaw === 'object' ? (pRaw.nakshatra?.name || pRaw.nakshatra) : null) || '-';
    const nakshatraTamil = (typeof pRaw === 'object' ? pRaw.nakshatraTamil : null) || '-';
    const nakLord = (typeof pRaw === 'object' ? pRaw.nakshatraLord : null) || getNakshatraLordHelper(nakshatraName);
    const pada = (typeof pRaw === 'object' ? pRaw.pada : null) || '';

    const degreeVal = (typeof pRaw === 'object' && pRaw.degree !== undefined) ? parseFloat(pRaw.degree) : 0;
    const degreeStr = !isNaN(degreeVal) && degreeVal > 0 ? degreeVal.toFixed(2) + '°' : '-';

    const dignityEnglish = (typeof pRaw === 'object' ? (pRaw.dignity?.english || pRaw.dignity) : null) || '-';
    const dignityTamil = dignityTamilMap[dignityEnglish] || dignityEnglish;

    return {
        planetName: pName,
        planetTamil: planetTamilMap[pName] || pName,
        signName,
        signTamil,
        lordName,
        lordTamil,
        nakshatraName: `${nakshatraName} ${pada ? '(' + pada + ')' : ''}`,
        nakshatraTamil,
        nakshatraLord: nakLord,
        degreeFormatted: degreeStr,
        dignityName: dignityEnglish,
        dignityTamil,
        isRetro: (typeof pRaw === 'object' ? pRaw.isRetro : false),
        isCombust: (typeof pRaw === 'object' ? pRaw.isCombust : false),
        raw: pRaw // Keep raw for debug if needed
    };
};

const formatPlanetaryData = (rawPlanets) => {
    if (!rawPlanets) return [];

    let planetList = [];

    // Check if data is in "House" format (keys are 1, 2, 3...) or "Planet" format (Sun, Moon...)
    const keys = Object.keys(rawPlanets);
    const isHouseData = keys.some(k => !isNaN(parseInt(k)));

    if (isHouseData) {
        // Extract planets from houses
        Object.values(rawPlanets).forEach(house => {
            let planets = [];
            if (Array.isArray(house)) {
                planets = house;
            } else if (house.planets) {
                planets = Array.isArray(house.planets) ? house.planets : Object.values(house.planets);
            } else if (house.Planets) { // Handle case variation
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
        // Already valid planet map
        Object.values(rawPlanets).forEach(pRaw => {
            const obj = processSinglePlanet(pRaw, null);
            if (obj) planetList.push(obj);
        });
    }
    return planetList;
};

module.exports = { formatPlanetaryData };
