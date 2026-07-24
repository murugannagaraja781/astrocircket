
async function debugZampaMismatch() {
    try {
        const res = await fetch('http://localhost:5001/api/players?search=Adam%20Zampa');
        const data = await res.json();

        if (data && data.players && data.players.length > 0) {
            const zampa = data.players[0];
            const p = zampa.birthChart?.planets || {};
            const fp = zampa.birthChart?.formattedPlanets || [];

            console.log("--- DATA MISMATCH CHECK ---");
            console.log("OBJECT (planets):");
            console.log("Mars:", p.Mars?.sign || p.Mars?.currentSign || "Missing");
            console.log("Venus:", p.Venus?.sign || p.Venus?.currentSign || "Missing");

            console.log("\nARRAY (formattedPlanets):");
            const marsF = fp.find(x => x.name === 'Mars');
            const venusF = fp.find(x => x.name === 'Venus');
            console.log("Mars:", marsF?.sign || marsF?.signName || "Missing");
            console.log("Venus:", venusF?.sign || venusF?.signName || "Missing");

        } else {
            console.log("Zampa Not Found");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}
debugZampaMismatch();
