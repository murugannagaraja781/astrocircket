const mongoose = require('mongoose');
const { evaluateBatsman } = require('./utils/ruleEngine');
require('dotenv').config();

const playerSchema = new mongoose.Schema({}, { strict: false });
const Player = mongoose.model('Player', playerSchema);

// Match: Gemini (Mercury), Mrigashirsha (Mars)
// Need Natal Mercury + Natal Mars Conjunction
const MATCH_RASI_LORD = 'Mercury';
const MATCH_STAR_LORD = 'Mars';

const OWN_SIGNS = {
    'Sun': ['Leo'], 'Moon': ['Cancer'], 'Mars': ['Aries', 'Scorpio'],
    'Mercury': ['Gemini', 'Virgo'], 'Jupiter': ['Sagittarius', 'Pisces'],
    'Venus': ['Taurus', 'Libra'], 'Saturn': ['Capricorn', 'Aquarius'],
    'Rahu': ['Aquarius'], 'Ketu': ['Scorpio']
};

const getSignName = (lng) => {
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    return signs[Math.floor(lng / 30)];
};

async function findRule9Candidates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const players = await Player.find({});
        console.log(`Scanning ${players.length} players for Rule 9 candidates...`);
        console.log(`Condition: Natal ${MATCH_RASI_LORD} & ${MATCH_STAR_LORD} Conjoined + Owned by Player's Lord.\n`);

        let count = 0;
        for (const p of players) {
            const chart = p.birthChart;
            if (!chart || !chart.planets) continue;

            // 1. Check Conjunction of Mercury & Mars
            // Note: DB stores planets in various formats. Assuming formattedPlanets or standard map.
            // Using a helper to find position.

            // Helper to get planet Longitude or Sign
            // Assuming chart.planets is object { Sun: 120, ... } or Array
            let pMercSign, pMarsSign;

            // Extract from standard object structure
            if (chart.planets['Mercury'] && chart.planets['Mars']) {
                pMercSign = getSignName(chart.planets['Mercury']);
                pMarsSign = getSignName(chart.planets['Mars']);
            }
            // Handle if planets are objects { Mercury: { currentSign: ... }, ... }
            else {
                // Try parsing raw or finding in array
                continue; // Skip complex parsing for this quick check if standard fails
            }

            if (pMercSign && pMarsSign && pMercSign === pMarsSign) {
                // CANDIDATE LEVEL 1: Conjunction Exists
                const conjunctionSign = pMercSign;

                // 2. Check Ownership
                const pRasiLord = chart.moonSign?.lord;
                const pStarLord = chart.nakshatra?.lord;

                const rasiOwned = OWN_SIGNS[pRasiLord] || [];
                const starOwned = OWN_SIGNS[pStarLord] || [];
                const allowed = [...rasiOwned, ...starOwned];

                if (allowed.includes(conjunctionSign)) {
                    count++;
                    console.log(`[CANDIDATE] ${p.name}`);
                    console.log(`   - Merc/Mars in ${conjunctionSign}`);
                    console.log(`   - Player Lords: ${pRasiLord} / ${pStarLord} (Owns ${allowed.join(', ')})`);

                    // Run Engine to Confirm
                    const matchChart = {
                        rashiLord: MATCH_RASI_LORD,
                        nakshatraLord: MATCH_STAR_LORD,
                        nakshatra: 'Mrigashirsha'
                    };

                    const playerInput = {
                        planetPositions: {
                            'Mercury': conjunctionSign,
                            'Mars': conjunctionSign,
                            // Fill others dummies if needed, but Engine uses P['Name']
                        },
                        rashiLord: pRasiLord,
                        nakshatraLord: pStarLord,
                        rashi: chart.moonSign?.english // For other rules
                    };

                    // Mock full planets map for engine P lookup
                    playerInput.planetPositions[pRasiLord] = "Aries"; // dummy
                    playerInput.planetPositions[pStarLord] = "Aries"; // dummy

                    // Actually, let's use the real chart data passed to engine style
                    // The engine expects 'player.planetPositions' to be Name->Sign Map.
                    // Let's create it properly from the candidate.
                    const pMap = {};
                    for (const k in chart.planets) {
                        pMap[k] = getSignName(chart.planets[k]);
                    }

                    const pObj = {
                        planetPositions: pMap,
                        rashiLord: pRasiLord,
                        nakshatraLord: pStarLord,
                        rashi: chart.moonSign?.english,
                        nakshatraLord: pStarLord // Ensure prop name matches
                    };

                    const mObj = {
                        rashiLord: MATCH_RASI_LORD,
                        nakshatraLord: MATCH_STAR_LORD,
                        nakshatra: 'Mrigashirsha'
                    };

                    const res = evaluateBatsman(pObj, mObj, { planetPositions: {} });

                    const rule9 = res.logs.find(l => l.en.includes("Rule 9"));
                    if (rule9) {
                        console.log(`   ✅ RULE 9 TRIGGERED: ${rule9.en}`);
                    } else {
                        console.log(`   ❌ Rule 9 NOT Triggered.`);
                        // Debug why
                        console.log(`      Engine sees: Match Lords ${MATCH_RASI_LORD}/${MATCH_STAR_LORD}`);
                        console.log(`      Player has ${MATCH_RASI_LORD} in ${pMap[MATCH_RASI_LORD]}`);
                        console.log(`      Player has ${MATCH_STAR_LORD} in ${pMap[MATCH_STAR_LORD]}`);
                    }
                    console.log("--------------------------------------------------");
                    if (count >= 3) break; // Check first 3 candidates
                }
            }
        }

        if (count === 0) console.log("No players found with Mercury+Mars conjunction in owned houses.");
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit();
    }
}

findRule9Candidates();
