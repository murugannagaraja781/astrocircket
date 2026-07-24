
async function debugZampa() {
    try {
        const res = await fetch('http://localhost:5001/api/players?search=Adam%20Zampa');
        const data = await res.json();

        if (data && data.players && data.players.length > 0) {
            const zampa = data.players[0];
            const p = zampa.birthChart?.planets || {};

            console.log("NAME:", zampa.name);
            console.log("DOB:", zampa.dob);
            console.log("MOON SIGN:", zampa.birthChart?.moonSign?.english || p.Moon?.sign);
            console.log("NAKSHATRA:", zampa.birthChart?.moonNakshatra?.name || p.Moon?.nakshatra);

            // Print all planets clearly
            const planets = {};
            for (const [key, val] of Object.entries(p)) {
                planets[key] = val.sign || val.signName;
            }
            console.log("PLANETS:", JSON.stringify(planets));

        } else {
            console.log("Zampa Not Found");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}
debugZampa();
