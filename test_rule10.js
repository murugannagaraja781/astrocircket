const { evaluatePrediction } = require('./server/utils/ruleEngine');

// Mock data for Match: Ashlesha (Sign 4: Cancer)
const matchParams = {
    year: 2024, month: 4, day: 26, hour: 12, minute: 0, // Date doesn't matter much for eval if we mock Moon
    latitude: 13, longitude: 80, timezone: 5.5,
    matchLagnas: [] // Optional
};

// Mock date that gives Ashlesha (Match Moon in Cancer ~106.40 to 120.00)
// Actually evaluatePrediction calculates match chart internally, so we need a date that results in Ashlesha.
// April 26 2024 should have Moon in Scorpio/Anuradha.
// Let's use a simpler way if we want to unit test: 
// The engine calls calculatePlanetaryPositions. 
// For a quick test, let's find a date for Ashlesha.

const testRule10 = () => {
    // Player: Shatabhisha (Sign 11: Aquarius. Longitude 306.40 to 320.00)
    const playerChart = {
        planets: {
            Moon: 310, // Aquarius / Shatabhisha
            Sun: 0, Mars: 0, Mercury: 0, Jupiter: 0, Venus: 0, Saturn: 0, Rahu: 0, Ketu: 180
        }
    };

    // Match Ashlesha date: 2024-05-17 has Moon in Leo/Magha.
    // Match Ashlesha date: 2024-05-14 at 17:00 should be Ashlesha (Cancer)
    const ashleshaMatch = {
        year: 2024, month: 5, day: 14, hour: 17, minute: 0,
        latitude: 13, longitude: 80, timezone: 5.5
    };

    const result = evaluatePrediction(playerChart, ashleshaMatch);

    console.log("Match Star:", result.matchStar);
    console.log("Batting Rules:", result.batting.rules.map(r => r.en));
    console.log("Batting Score:", result.batting.score);

    const rule10Found = result.batting.rules.some(r => r.en.includes("Rule 10"));
    if (rule10Found && result.batting.score >= 20) {
        console.log("✅ Special Rule 10 Verified Successfully!");
    } else {
        console.log("❌ Special Rule 10 Verification Failed.");
    }
};

testRule10();
