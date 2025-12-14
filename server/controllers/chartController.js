const axios = require('axios');

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
        res.json(response.data);

    } catch (err) {
        console.error(err.message);
        // forwarding the error response from the external API if available
        if (err.response) {
            return res.status(err.response.status).json(err.response.data);
        }
        res.status(500).send('Server Error');
    }
};
