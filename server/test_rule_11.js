const { evaluatePrediction } = require('./utils/ruleEngine');

// Mock a player born under Swati (Rahu Lord)
// Swati is from 186.40 to 200 degrees (Libra)
const playerChart = {
    planets: {
        Moon: { longitude: 190 }, // Swati (Rahu Lord)
        Rahu: { longitude: 40 },  // Taurus (Venus owned)
        Ketu: { longitude: 220 }, // Scorpio (Mars owned)
        Sun: 0, Mars: 0, Mercury: 0, Jupiter: 0, Venus: 0, Saturn: 0
    }
};

// We want a match where:
// Match Rasi Lord = Venus (Match Moon in Taurus/Libra)
// Match Star Lord = Mars (Match Moon in Mirugasirisam/Chitra/Dhanishta)
// Let's try to find a time for this or just hope evaluatePrediction handles our forced matchChart if we provide one...
// Wait, evaluatePrediction takes matchParams and calculates it.
// To bypass real calculation, let's just make the test script more "astrological".

console.log("--- Rule 11 Test ---");

// Mirigasirisam (Mars) is approx 53.20' to 66.40' (Taurus/Gemini)
// Let's find a date when Moon is in Mirigasirisam.
// 2024-05-23 10:00 AM approx.

const matchParams = {
    year: 2024, month: 5, day: 23, hour: 10, minute: 0,
    latitude: 13.0827, longitude: 80.2707, timezone: 5.5
};

try {
    const result = evaluatePrediction(playerChart, matchParams);
    
    console.log(`Match Star: ${result.matchStar} (${result.matchStarLord})`);
    console.log(`Match Rasi Lord: ${result.matchRasiLord}`);
    console.log(`Player Star: ${playerChart.planets.Moon.longitude === 190 ? "Swati (Rahu)" : "Other"}`);
    
    const rule11 = result.batting.rules.find(r => r.name.includes("Rule 11"));
    if (rule11) {
        console.log("✅ Rule 11 TRIGGERED: " + rule11.tamil);
    } else {
        console.log("❌ Rule 11 NOT triggered.");
        console.log("Batting Rules:", result.batting.rules.map(r => r.name));
    }
} catch (e) {
    console.error("Test Error:", e);
}
