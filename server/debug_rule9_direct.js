const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://murugannagaraja781_db_user:NewLife2025@cluster0.tp2gekn.mongodb.net/circket";

const playerSchema = new mongoose.Schema({}, { strict: false });
const Player = mongoose.model('Player', playerSchema);

const OWN_SIGNS = {
    'Sun': ['Leo'], 'Moon': ['Cancer'], 'Mars': ['Aries', 'Scorpio'],
    'Mercury': ['Gemini', 'Virgo'], 'Jupiter': ['Sagittarius', 'Pisces'],
    'Venus': ['Taurus', 'Libra'], 'Saturn': ['Capricorn', 'Aquarius'],
    'Rahu': ['Aquarius'], 'Ketu': ['Scorpio']
};

const getSignName = (lng) => {
    if (lng === undefined || lng === null) return null;
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    return signs[Math.floor((lng % 360) / 30)];
};

async function run() {
    try {
        console.log("Connecting...");
        await mongoose.connect(MONGO_URI);
        const players = await Player.find({});
        console.log(`Scanning ${players.length} players for Mercury+Mars Conjunction Rule...`);

        let candidates = 0;

        for (const p of players) {
            const chart = p.birthChart;
            if (!chart || !chart.planets) continue;

            // Extract Planet Data
            let mercLng, marsLng;

            // Handle { "Mercury": 123.45 } format
            if (typeof chart.planets['Mercury'] === 'number') mercLng = chart.planets['Mercury'];
            if (typeof chart.planets['Mars'] === 'number') marsLng = chart.planets['Mars'];

            // Handle { "Mercury": { "currentSign": ... } } format
            if (mercLng === undefined && chart.planets['Mercury']?.raw?.long) mercLng = chart.planets['Mercury'].raw.long;
            if (marsLng === undefined && chart.planets['Mars']?.raw?.long) marsLng = chart.planets['Mars'].raw.long;

            if (mercLng === undefined || marsLng === undefined) continue;

            const mercSign = getSignName(mercLng);
            const marsSign = getSignName(marsLng);

            // 1. Check Conjunction
            if (mercSign && marsSign && mercSign === marsSign) {
                // 2. Check Ownership
                const rasiLord = chart.moonSign?.lord;
                const starLord = chart.nakshatra?.lord;

                if (!rasiLord || !starLord) continue;

                const allowed = [...(OWN_SIGNS[rasiLord] || []), ...(OWN_SIGNS[starLord] || [])];

                if (allowed.includes(mercSign)) {
                    console.log(`FOUND: ${p.name} (Merc+Mars in ${mercSign})`);
                    console.log(`       Lords: ${rasiLord}, ${starLord} (Allowed: ${allowed.join(',')})`);
                    candidates++;
                }
            }
        }

        if (candidates === 0) {
            console.log("NO candidates found.");
        }

        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}

run();
