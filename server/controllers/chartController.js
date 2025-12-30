const { calculateSign, calculateNakshatra, calculateDignity, formatDegree, calculatePlanetaryPositions } = require('../utils/astroCalculator');

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
