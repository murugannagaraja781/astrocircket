const { calculateSign, calculateNakshatra, calculateDignity, formatDegree, calculatePlanetaryPositions, NAKSHATRAS } = require('../utils/astroCalculator');

// Panchangam calculation helpers
const TITHIS = [
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya'
];

const TITHIS_TAMIL = [
    'பிரதமை', 'துவிதியை', 'திருதியை', 'சதுர்த்தி', 'பஞ்சமி',
    'சஷ்டி', 'சப்தமி', 'அஷ்டமி', 'நவமி', 'தசமி',
    'ஏகாதசி', 'துவாதசி', 'திரயோதசி', 'சதுர்தசி', 'பூர்ணிமை/அமாவாசை'
];

const VARAS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const VARAS_TAMIL = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];

const YOGAS = [
    'Vishkumbha', 'Preeti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma',
    'Dhriti', 'Shoola', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
    'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha',
    'Shukla', 'Brahma', 'Indra', 'Vaidhriti'
];

const KARANAS = [
    'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garija', 'Vanija', 'Vishti',
    'Shakuni', 'Chatushpada', 'Naga', 'Kimstughna'
];

const calculateTithi = (sunLng, moonLng) => {
    let diff = moonLng - sunLng;
    if (diff < 0) diff += 360;
    const tithiIndex = Math.floor(diff / 12) % 15;
    return {
        name: TITHIS[tithiIndex],
        tamil: TITHIS_TAMIL[tithiIndex],
        index: tithiIndex + 1
    };
};

const calculateVara = (year, month, day) => {
    const date = new Date(year, month - 1, day);
    const dayIndex = date.getDay();
    return {
        name: VARAS[dayIndex],
        tamil: VARAS_TAMIL[dayIndex]
    };
};

const calculateYoga = (sunLng, moonLng) => {
    const sum = (sunLng + moonLng) % 360;
    const yogaIndex = Math.floor(sum / (360 / 27)) % 27;
    return {
        name: YOGAS[yogaIndex],
        index: yogaIndex + 1
    };
};

const calculateKarana = (sunLng, moonLng) => {
    let diff = moonLng - sunLng;
    if (diff < 0) diff += 360;
    const karanaIndex = Math.floor(diff / 6) % 11;
    return {
        name: KARANAS[karanaIndex],
        index: karanaIndex + 1
    };
};

// Simple sunrise/sunset calculation (approximate for India)
const calculateSunTimes = (latitude, longitude, year, month, day) => {
    const baseRise = 6;
    const baseSet = 18;

    // Seasonal adjustment (rough approximation)
    const dayOfYear = Math.floor((new Date(year, month - 1, day) - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
    const adjustment = Math.sin((dayOfYear - 80) * Math.PI / 182.5) * 0.5;

    const riseHour = baseRise - adjustment;
    const setHour = baseSet + adjustment;

    const formatTime = (h) => {
        const hours = Math.floor(h);
        const mins = Math.floor((h - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    return {
        sunrise: formatTime(riseHour),
        sunset: formatTime(setHour)
    };
};

exports.getBirthChart = async (req, res) => {
    try {
        const { day, hour, latitude, longitude, minute, month, timezone, year, ayanamsa, battingHour, battingMinute, bowlingHour, bowlingMinute } = req.body;

        // Calculate planetary positions locally
        const { planets, ascendant } = calculatePlanetaryPositions(
            parseInt(year), parseInt(month), parseInt(day),
            parseInt(hour), parseInt(minute),
            parseFloat(latitude), parseFloat(longitude), parseFloat(timezone),
            ayanamsa // Pass Ayanamsa preference
        );

        // Optional: Calculate Batting Lagna
        let battingLagnaData = null;
        if (battingHour !== undefined && battingMinute !== undefined && battingHour !== "" && battingMinute !== "") {
            const { ascendant: batAsc } = calculatePlanetaryPositions(
                parseInt(year), parseInt(month), parseInt(day),
                parseInt(battingHour), parseInt(battingMinute),
                parseFloat(latitude), parseFloat(longitude), parseFloat(timezone),
                ayanamsa
            );
            const batSign = calculateSign(batAsc);
            battingLagnaData = {
                sign: batSign.name,
                lord: batSign.lord
            };
        }

        // Optional: Calculate Bowling Lagna
        let bowlingLagnaData = null;
        if (bowlingHour !== undefined && bowlingMinute !== undefined && bowlingHour !== "" && bowlingMinute !== "") {
            const { ascendant: bowlAsc } = calculatePlanetaryPositions(
                parseInt(year), parseInt(month), parseInt(day),
                parseInt(bowlingHour), parseInt(bowlingMinute),
                parseFloat(latitude), parseFloat(longitude), parseFloat(timezone),
                ayanamsa
            );
            const bowlSign = calculateSign(bowlAsc);
            bowlingLagnaData = {
                sign: bowlSign.name,
                lord: bowlSign.lord
            };
        }

        const pad = (n) => n.toString().padStart(2, '0');
        const userProvidedTimestamp = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00.000Z`;

        // Build chart response
        const chartData = {
            timestamp: userProvidedTimestamp,
            input: { day, month, year, hour, minute, latitude, longitude, timezone },
            ascendant: {
                longitude: ascendant,
                ...calculateSign(ascendant),
                nakshatra: calculateNakshatra(ascendant)
            },
            battingLagnaSign: battingLagnaData?.sign,
            battingLagnaLord: battingLagnaData?.lord,
            bowlingLagnaSign: bowlingLagnaData?.sign,
            bowlingLagnaLord: bowlingLagnaData?.lord,
            moonSign: calculateSign(planets.Moon),
            nakshatra: calculateNakshatra(planets.Moon),
            planets: {}
        };

        // Calculate details for each planet
        for (const [planetName, lng] of Object.entries(planets)) {
            const sign = calculateSign(lng);
            const nak = calculateNakshatra(lng);
            const dignity = calculateDignity(planetName, lng);

            chartData.planets[planetName] = {
                longitude: lng,
                sign: sign.name,
                signTamil: sign.tamil,
                signLord: sign.lord,
                degreesInSign: sign.degreesInSign,
                nakshatra: nak.name,
                nakshatraTamil: nak.tamil,
                nakshatraLord: nak.lord,
                pada: nak.pada,
                dignity: dignity.english,
                dignityTamil: dignity.tamil,
                dignityColor: dignity.color,
                dignityColorName: dignity.colorName,
                formattedDegree: formatDegree(sign.degreesInSign)
            };
        }

        // Generate houses (using equal house system from ascendant)
        chartData.houses = [];
        for (let i = 0; i < 12; i++) {
            const houseLng = (ascendant + i * 30) % 360;
            const houseSign = calculateSign(houseLng);
            const signNumber = Math.floor(houseLng / 30) + 1;

            // Find planets in this house's sign
            const planetsInHouse = Object.entries(chartData.planets)
                .filter(([_, pData]) => pData.sign === houseSign.name)
                .map(([pName]) => pName);

            chartData.houses.push({
                house: i + 1,
                longitude: houseLng,
                signNumber: signNumber,
                sign: houseSign.name,
                signTamil: houseSign.tamil,
                lord: houseSign.lord,
                planets: planetsInHouse
            });
        }

        // Generate dignity summary
        chartData.dignitySummary = {
            title: 'கிரக பலன் சுருக்கம் - Planetary Dignity Summary',
            உச்சம்_Exalted: [],
            நீச்சம்_Debilitated: [],
            ஆட்சி_OwnSign: [],
            நட்பு_Friendly: [],
            பகை_Enemy: [],
            சமம்_Neutral: []
        };

        const tamilPlanets = {
            Sun: 'சூரியன்', Moon: 'சந்திரன்', Mars: 'செவ்வாய்', Mercury: 'புதன்',
            Jupiter: 'குரு', Venus: 'சுக்கிரன்', Saturn: 'சனி', Rahu: 'ராகு', Ketu: 'கேது'
        };

        for (const [planetName, data] of Object.entries(chartData.planets)) {
            const entry = {
                planet: planetName,
                planetTamil: tamilPlanets[planetName] || planetName,
                sign: data.sign,
                signTamil: data.signTamil,
                dignity: data.dignity,
                dignityTamil: data.dignityTamil
            };

            if (data.dignity === 'Exalted') chartData.dignitySummary.உச்சம்_Exalted.push(entry);
            else if (data.dignity === 'Debilitated') chartData.dignitySummary.நீச்சம்_Debilitated.push(entry);
            else if (data.dignity === 'Own Sign') chartData.dignitySummary.ஆட்சி_OwnSign.push(entry);
            else if (data.dignity === 'Friendly') chartData.dignitySummary.நட்பு_Friendly.push(entry);
            else if (data.dignity === 'Enemy') chartData.dignitySummary.பகை_Enemy.push(entry);
            else chartData.dignitySummary.சமம்_Neutral.push(entry);
        }

        // *** PANCHANGAM CALCULATION ***
        const sunLng = planets.Sun;
        const moonLng = planets.Moon;
        const moonNak = calculateNakshatra(moonLng);
        const sunTimes = calculateSunTimes(parseFloat(latitude), parseFloat(longitude), parseInt(year), parseInt(month), parseInt(day));

        chartData.panchangam = {
            tithi: calculateTithi(sunLng, moonLng),
            vara: calculateVara(parseInt(year), parseInt(month), parseInt(day)),
            nakshatra: {
                name: moonNak.name,
                tamil: moonNak.tamil,
                lord: moonNak.lord,
                pada: moonNak.pada
            },
            yoga: calculateYoga(sunLng, moonLng),
            karana: calculateKarana(sunLng, moonLng),
            sunrise: sunTimes.sunrise,
            sunset: sunTimes.sunset
        };

        res.json(chartData);

    } catch (err) {
        console.error('Local Chart Calculation Error:', err.message);
        res.status(500).json({ error: 'Chart calculation failed', message: err.message });
    }
};
