const axios = require('axios');
const { formatPlanetaryData } = require('../utils/chartUtils');

exports.getBirthChart = async (req, res) => {
    try {
        const { day, hour, latitude, longitude, minute, month, timezone, year } = req.body;

        // Construct payload for external API
        const payload = {
            day,
            hour,
            latitude,
            longitude,
            minute,
            month,
            timezone,
            year
        };

        const response = await axios.post('https://newapi-production-ea98.up.railway.app/api/charts/birth-chart', payload);

        // --- DATA TRANSFORMATION START ---
        const rawData = response.data;
        const formattedPlanets = formatPlanetaryData(rawData.planets || rawData.houses);

        // Merge formatted formattedPlanets into response
        const finalResponse = {
            ...rawData,
            formattedPlanets
        };
        // --- DATA TRANSFORMATION END ---

        res.json(finalResponse);

    } catch (err) {
        console.error(err.message);
        // forwarding the error response from the external API if available
        if (err.response) {
            return res.status(err.response.status).json(err.response.data);
        }
        res.status(500).send('Server Error');
    }
};
