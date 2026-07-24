const { evaluatePrediction } = require('./utils/ruleEngine');

// Mock Player Chart (Venus and Mercury Conjoined)
// Let's put Venus and Mercury in Sagittarius (Sign 9)
// Player Lord MUST be Venus or Mercury for rule to trigger.
// Let's set Player Rasi Lord to Venus (e.g. Rasi = Taurus or Libra)
const playerChart = {
    planets: {
        "Sun": { longitude: 269.82, signId: 9 }, // Sag
        "Moon": { longitude: 215, signId: 8 }, // Scorpio
        "Mars": { longitude: 265, signId: 9 }, // Sag
        "Mercury": { longitude: 260, signId: 9 }, // Sag (Conjoined with Venus)
        "Jupiter": { longitude: 197, signId: 7 }, // Lib
        "Venus": { longitude: 269, signId: 9 }, // Sag
        "Saturn": { longitude: 304, signId: 11 }, // Aqu
        "Rahu": { longitude: 216, signId: 8 }, // Sco
        "Ketu": { longitude: 36, signId: 2 } // Tau
    }
};

const OWN_SIGNS = {
    'Sun': [5], 'Moon': [4], 'Mars': [1, 8], 'Mercury': [3, 6],
    'Jupiter': [9, 12], 'Venus': [2, 7], 'Saturn': [10, 11],
    'Rahu': [11], 'Ketu': [8]
};

const getOwnedSigns = (planet) => OWN_SIGNS[planet] || [];

const calculateSign = (lng) => {
    const id = Math.floor(lng / 30) + 1;
    return { id };
};

const getPlanetPosition = (planet, chart) => {
    const lng = chart.planets[planet]?.longitude || chart.planets[planet];
    if (lng === undefined) return null;
    const sign = calculateSign(lng);
    return { name: planet, longitude: lng, signId: sign.id };
};

// Simulate Server Loop
function testBharaniRule() {
    console.log("Testing Bharani: Venus + Mercury Conjunction...");

    const playerRasiLord = "Venus"; // Satisfies "Player Rasi Lord is Venus"
    const playerStarLord = "Mars";
    const P = playerChart;

    // Check Conjunction in Player Chart
    const venusPos = getPlanetPosition('Venus', playerChart);
    const mercuryPos = getPlanetPosition('Mercury', playerChart);

    const isConjoined = venusPos.signId === mercuryPos.signId;
    console.log(`P[Venus]=${venusPos.signId}, P[Mercury]=${mercuryPos.signId}, Conjoined=${isConjoined}`);

    // Check Identity Condition
    const isVenusOrMercuryLord = ['Venus', 'Mercury'].includes(playerRasiLord) || ['Venus', 'Mercury'].includes(playerStarLord);
    console.log(`Player Rasi Lord=${playerRasiLord}, Star Lord=${playerStarLord}. Condition Met=${isVenusOrMercuryLord}`);

    if (isVenusOrMercuryLord && isConjoined) {
        console.log("✅ Custom Rule Triggered:");
        console.log("   -> Batting: SURE FLOP");
        console.log("   -> Bowling: +12 Points");
    } else {
        console.log("❌ Custom Rule FAILED to trigger");
    }
}

testBharaniRule();
