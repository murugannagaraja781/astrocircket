
async function debugFullDump() {
    try {
        const res = await fetch('http://localhost:5001/api/players?search=Adam%20Zampa');
        const data = await res.json();
        const zampa = data.players[0];
        console.log(JSON.stringify(zampa, null, 2));
    } catch (e) { console.error(e); }
}
debugFullDump();
