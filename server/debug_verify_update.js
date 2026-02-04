
async function verifyUpdate() {
    try {
        const res = await fetch('http://localhost:5001/api/players?search=Adam%20Zampa');
        const data = await res.json();

        if (data && data.players && data.players.length > 0) {
            const zampa = data.players[0];
            const p = zampa.birthChart?.planets || {};

            console.log("--- UPDATED ZAMPA DATA ---");
            console.log("Rasi:", zampa.birthChart.moonSign?.english || p.Moon?.sign);
            console.log("Nakshatra:", zampa.birthChart.moonNakshatra?.name || p.Moon?.nakshatra);
            console.log("Mars:", p.Mars?.sign || p.Mars?.currentSign || "Missing");
            console.log("Venus:", p.Venus?.sign || p.Venus?.currentSign || "Missing");

            const fp = zampa.birthChart?.formattedPlanets || [];
            console.log("Formatted Planets Count:", fp.length);

            if (fp.length > 0) {
                const m = fp.find(x => x.name === 'Mars');
                const v = fp.find(x => x.name === 'Venus');
                console.log("Formatted Mars:", m?.sign || m?.signName);
                console.log("Formatted Venus:", v?.sign || v?.signName);
            }

        } else {
            console.log("Zampa Not Found");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}
verifyUpdate();
