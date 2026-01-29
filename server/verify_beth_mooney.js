const { evaluatePrediction } = require('./utils/ruleEngine');

// Mock Player Chart (Beth Mooney)
const playerChart = {
    planets: {
        "Sun": { longitude: 269.82, signId: 9 }, // Sag
        "Moon": { longitude: 294.52, signId: 10, nakshatra: "Dhanishta", nakLord: "Mars", signLord: "Saturn" }, // Cap, Dhanishta
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
    const lng = chart.planets[planet];
    if (lng === undefined) return null;
    const sign = calculateSign(lng);
    return { name: planet, longitude: lng, signId: sign.id };
};

function testRule9() {
    console.log("Testing Rule 9 for Beth Mooney...");

    // Player Lords
    const playerRasiLord = "Saturn";
    const playerStarLord = "Mars";

    // Match Lords (From Scenario)
    const matchRasiLord = "Mars"; // Moon in Aries
    const matchStarLord = "Ketu"; // Star Ashwini

    // Transit Positions
    const mPlanets = {
        "Mars": 215, // Scorpio (Sign 8)
        "Ketu": 215  // Scorpio (Sign 8)
    };

    const mRasiLordPos = getPlanetPosition(matchRasiLord, { planets: mPlanets });
    const mStarLordPos = getPlanetPosition(matchStarLord, { planets: mPlanets });

    console.log(`Player Lords: Rasi=${playerRasiLord}, Star=${playerStarLord}`);
    console.log(`Match Lords: Rasi=${matchRasiLord}, Star=${matchStarLord}`);
    console.log(`Transit Pos: ${matchRasiLord}=${mRasiLordPos?.signId}, ${matchStarLord}=${mStarLordPos?.signId}`);

    if (matchRasiLord && matchStarLord && playerRasiLord && playerStarLord) {
        const pRasiLordSigns = getOwnedSigns(playerRasiLord); // [10, 11]
        const pStarLordSigns = getOwnedSigns(playerStarLord); // [1, 8]
        const allowedSigns = [...new Set([...pRasiLordSigns, ...pStarLordSigns])];
        console.log("Allowed Signs (Player Lord Houses):", allowedSigns);

        // CHECK 1: Conjunction
        const isConjoined = mRasiLordPos && mStarLordPos && mRasiLordPos.signId === mStarLordPos.signId;
        console.log("Is Conjoined?", isConjoined);

        // CHECK 2: Allowed Sign
        const isInPlayerLordHouse = mRasiLordPos && allowedSigns.includes(mRasiLordPos.signId);
        console.log("Is In Player Lord House?", isInPlayerLordHouse);

        if (isConjoined && isInPlayerLordHouse) {
            console.log("✅ RULE 9 TRIGGERED: +12 Points");
        } else {
            console.log("❌ Rule 9 NOT Triggered");
        }
    }
}

testRule9();
