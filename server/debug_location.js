
async function debugLocation() {
    try {
        const res = await fetch('http://localhost:5001/api/players?search=Adam%20Zampa');
        const data = await res.json();
        const zampa = data.players[0];
        console.log("LOC CHECK:");
        console.log("Name:", zampa.name);
        console.log("Place:", zampa.birthPlace);
        console.log("Lat:", zampa.latitude);
        console.log("Long:", zampa.longitude);
        console.log("Timezone:", zampa.timezone);
        console.log("BirthTime:", zampa.birthTime);
    } catch (e) { console.error(e); }
}
debugLocation();
