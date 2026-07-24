const { evaluatePrediction } = require('./utils/ruleEngine');

// Mock Player Chart (Beth Mooney)
const playerChart = {
    planets: {
        "Sun": { longitude: 269.82, signId: 9 }, // Sag
        "Moon": { longitude: 294.52, signId: 10, nakshatra: "Dhanishta", nakLord: "Mars", signLord: "Saturn" },
        "Mars": { longitude: 265.26, signId: 9 }, // Sag
        "Mercury": { longitude: 276.20, signId: 10 }, // Cap
        "Jupiter": { longitude: 197.82, signId: 7 }, // Lib
        "Venus": { longitude: 269.08, signId: 9 }, // Sag
        "Saturn": { longitude: 304.55, signId: 11 }, // Aqu
        "Rahu": { longitude: 216.61, signId: 8 }, // Sco
        "Ketu": { longitude: 36.61, signId: 2 } // Tau
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

function testRule9() {
    console.log("Testing Rule 9 for Beth Mooney (Player Chart Conjunction)...");

    const playerRasiLord = "Saturn";
    const playerStarLord = "Mars";
    const P = playerChart;

    // Scenario: Match in Hasta (Mercury/Moon).
    const matchRasiLord = "Mercury";
    const matchStarLord = "Moon";

    // Check positions in PLAYER CHART (Beth Mooney)
    // Moon in Capricorn (10)
    // Mercury in Capricorn (10)
    // => They ARE conjoined in Player Chart!
    // House 10 is owned by Saturn. Saturn is Player Rasi Lord.
    // => Should Trigger!

    const matchRasiLordPosInPlayer = {
        name: matchRasiLord,
        longitude: P.planets[matchRasiLord].longitude,
        signId: P.planets[matchRasiLord].signId
    };
    const matchStarLordPosInPlayer = {
        name: matchStarLord,
        longitude: P.planets[matchStarLord].longitude,
        signId: P.planets[matchStarLord].signId
    };

    console.log(`Player Lords: Rasi=${playerRasiLord}, Star=${playerStarLord}`);
    console.log(`Match Lords: Rasi=${matchRasiLord}, Star=${matchStarLord}`);
    console.log(`Pos in Player Chart: Mercury=${matchRasiLordPosInPlayer.signId}, Moon=${matchStarLordPosInPlayer.signId}`);

    if (matchRasiLord && matchStarLord && playerRasiLord && playerStarLord) {
        const pRasiLordSigns = getOwnedSigns(playerRasiLord); // [10, 11]
        const pStarLordSigns = getOwnedSigns(playerStarLord); // [1, 8]
        const allowedSigns = [...new Set([...pRasiLordSigns, ...pStarLordSigns])];
        console.log("Allowed Signs:", allowedSigns);

        // CHECK 1: Conjunction In Player Chart
        const isConjoined = matchRasiLordPosInPlayer.signId === matchStarLordPosInPlayer.signId;
        console.log("Is Conjoined in Player Chart?", isConjoined);

        // CHECK 2: Allowed Sign
        const isInPlayerLordHouse = allowedSigns.includes(matchRasiLordPosInPlayer.signId);
        console.log("Is In Player Lord House?", isInPlayerLordHouse);

        if (isConjoined && isInPlayerLordHouse) {
            console.log("✅ RULE 9 TRIGGERED: +12 Points");
        } else {
            console.log("❌ Rule 9 NOT Triggered");
        }
    }
}

testRule9();
