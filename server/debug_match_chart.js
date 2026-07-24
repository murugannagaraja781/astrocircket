
const axios = require('axios');

async function testMatchChart() {
    try {
        const payload = {
            day: 29, month: 1, year: 2026,
            hour: 19, minute: 30,
            latitude: 19.0760, longitude: 72.8777,
            timezone: 5.5,
            ayanamsa: 'Lahiri'
        };

        console.log("Sending payload:", payload);
        const res = await axios.post('http://localhost:5001/api/charts/birth-chart', payload);
        console.log("Status:", res.status);
        if (res.data && res.data.planets) {
            console.log("Chart Generated!");
            console.log("Ascendant:", res.data.ascendant?.tamil);
            console.log("Moon:", res.data.planets.Moon?.sign, res.data.planets.Moon?.nakshatra);
        } else {
            console.log("Response data invalid:", res.data);
        }
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error("Data:", e.response.data);
    }
}
testMatchChart();
