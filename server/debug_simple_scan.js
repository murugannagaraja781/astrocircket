const mongoose = require('mongoose');
require('dotenv').config();

const playerSchema = new mongoose.Schema({}, { strict: false });
const Player = mongoose.model('Player', playerSchema);

const OWN_SIGNS = {
    'Sun': ['Leo'], 'Moon': ['Cancer'], 'Mars': ['Aries', 'Scorpio'],
    'Mercury': ['Gemini', 'Virgo'], 'Jupiter': ['Sagittarius', 'Pisces'],
    'Venus': ['Taurus', 'Libra'], 'Saturn': ['Capricorn', 'Aquarius'],
    'Rahu': ['Aquarius'], 'Ketu': ['Scorpio']
};

const getSignName = (lng) => {
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    return signs[Math.floor((lng % 360) / 30)];
};

async function scan() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const players = await Player.find({});
        console.log(`Scanning ${players.length} players...`);
        let count = 0;

        for (const p of players) {
            if (!p.birthChart || !p.birthChart.planets) continue;

            // Extract Planet Longitudes
            let mercLng, marsLng;

            // Handle Object Map format (common in this DB based on dumps)
            // p.birthChart.planets might be { Sun: 120, Moon: 40 ... } OR { Sun: { currentSign: ... } }
            const planets = p.birthChart.planets;

            if (typeof planets === 'object') {
                if (typeof planets['Mercury'] === 'number') mercLng = planets['Mercury'];
                else if (planets['Mercury']?.currentSign) continue; // Skip complex for now, focus on raw lng

                if (typeof planets['Mars'] === 'number') marsLng = planets['Mars'];
            }

            if (mercLng === undefined || marsLng === undefined) continue;

            const mercSign = getSignName(mercLng);
            const marsSign = getSignName(marsLng);

            if (mercSign === marsSign) {
                // Conjunction Found!
                const rasiLord = p.birthChart.moonSign?.lord;
                const starLord = p.birthChart.nakshatra?.lord;

                const allowed = [...(OWN_SIGNS[rasiLord] || []), ...(OWN_SIGNS[starLord] || [])];

                if (allowed.includes(mercSign)) {
                    console.log(`MATCH FOUND: ${p.name}`);
                    console.log(`- Mercury & Mars in ${mercSign}`);
                    console.log(`- Lords: ${rasiLord}, ${starLord} (Owns ${allowed.join(',')})`);
                    count++;
                }
            }
        }

        console.log(`Total Rule 9 Candidates found: ${count}`);
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}

scan();
