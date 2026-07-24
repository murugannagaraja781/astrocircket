const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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
        console.log("Connecting to DB...");
        if (!process.env.MONGODB_URI) throw new Error("Missing MONGODB_URI in .env");

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected. Fetching players...");

        const players = await Player.find({});
        console.log(`Scanned ${players.length} players.`);

        let candidates = [];

        for (const p of players) {
            const chart = p.birthChart;
            if (!chart || !chart.planets) continue;

            // Extract Planet Data
            let mercLng, marsLng;

            // Handle { "Mercury": 123.45 } format
            if (typeof chart.planets['Mercury'] === 'number') mercLng = chart.planets['Mercury'];
            if (typeof chart.planets['Mars'] === 'number') marsLng = chart.planets['Mars'];

            // Handle { "Mercury": { "currentSign": ... } } format (some dumps have this)
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
                    candidates.push({
                        name: p.name,
                        conjunction: mercSign,
                        lords: `${rasiLord}/${starLord}`,
                        allowed: allowed.join(',')
                    });
                }
            }
        }

        console.log(`\n\n=== RULE 9 CANDIDATES (${candidates.length}) ===`);
        if (candidates.length > 0) {
            candidates.slice(0, 10).forEach(c => {
                console.log(`- ${c.name}: Merc+Mars in ${c.conjunction} (Lords: ${c.lords})`);
            });
            if (candidates.length > 10) console.log(`... and ${candidates.length - 10} more.`);
        } else {
            console.log("NO PLAYERS match Rule 9 for this match (Mercury+Mars).");
        }

        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e.message);
        process.exit(1);
    }
}

run();
