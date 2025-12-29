const { calculateSign, calculateNakshatra, calculateDignity, formatDegree } = require('../utils/astroCalculator');

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

    // Planets (mean longitude approximations)
    const planets = {
        Sun: (sunLong + 360) % 360,
        Moon: (moonLong + 360) % 360,
        Mars: (355.45 + 0.5240208 * d + 360) % 360,
        Mercury: (48.33 + 4.0923344 * d + 360) % 360,
        Jupiter: (34.40 + 0.0830853 * d + 360) % 360,
        Venus: (181.98 + 1.6021302 * d + 360) % 360,
        Saturn: (50.08 + 0.0334442 * d + 360) % 360,
        Rahu: (125.04 - 0.0529539 * d + 360) % 360, // Mean node
    };
    planets.Ketu = (planets.Rahu + 180) % 360; // Opposite of Rahu

    // Ascendant (Lagna) - simplified calculation
    const lst = (100.46 + 0.985647 * d + longitude + (hour + minute / 60) * 15) % 360;
    const ascendant = (lst + 360) % 360;

    return { planets, ascendant };
};

exports.getBirthChart = async (req, res) => {
    try {
        const { day, hour, latitude, longitude, minute, month, timezone, year } = req.body;

        // Calculate planetary positions locally
        const { planets, ascendant } = calculatePlanetaryPositions(
            parseInt(year), parseInt(month), parseInt(day),
            parseInt(hour), parseInt(minute),
            parseFloat(latitude), parseFloat(longitude), parseFloat(timezone)
        );

        // Build chart response
        const chartData = {
            timestamp: new Date().toISOString(),
            input: { day, month, year, hour, minute, latitude, longitude, timezone },
            ascendant: {
                longitude: ascendant,
                ...calculateSign(ascendant),
                nakshatra: calculateNakshatra(ascendant)
            },
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
            chartData.houses.push({
                house: i + 1,
                longitude: houseLng,
                sign: houseSign.name,
                signTamil: houseSign.tamil,
                lord: houseSign.lord
            });
        }

        // Generate dignity summary - கிரக பலன் சுருக்கம்
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

        res.json(chartData);

    } catch (err) {
        console.error('Local Chart Calculation Error:', err.message);
        res.status(500).json({ error: 'Chart calculation failed', message: err.message });
    }
};
