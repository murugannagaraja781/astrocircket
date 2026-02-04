const axios = require('axios');

async function debugZampa() {
    try {
        console.log("Fetching players...");
        // Fetch users from the local API
        const res = await axios.get('http://localhost:5001/api/players?search=Adam%20Zampa');

        if (res.data && res.data.players && res.data.players.length > 0) {
            const zampa = res.data.players[0];
            console.log("Found Player:", zampa.name);
            console.log("DOB:", zampa.dob);
            console.log("Birth Chart Keys:", Object.keys(zampa.birthChart || {}));

            if (zampa.birthChart) {
                console.log("Planets Data:", JSON.stringify(zampa.birthChart.planets, null, 2));
                console.log("Formatted Planets:", JSON.stringify(zampa.birthChart.formattedPlanets, null, 2));
                console.log("Moon Sign Structure:", JSON.stringify(zampa.birthChart.moonSign, null, 2));
            } else {
                console.log("DATA ERROR: birthChart is MISSING or NULL");
            }

        } else {
            console.log("Player 'Adam Zampa' not found in DB.");
        }
    } catch (err) {
        console.error("Error fetching data:", err.message);
    }
}

debugZampa();
