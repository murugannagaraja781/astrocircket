const { evaluatePrediction } = require("./utils/ruleEngine");

// Mock Data to trigger multiple rules
const playerBirthChart = {
    planets: {
        "Moon": { longitude: 10, signId: 1, nakshatra: "Ashwini", nakLord: "Ketu", signLord: "Mars" }, // Aries
        "Mars": { longitude: 15, signId: 1 }, // Own Sign
        "Venus": { longitude: 45, signId: 2 }, // Exalted/Own
        "Sun": { longitude: 80, signId: 3 }
    }
};

const matchParams = {
    year: 2024,
    month: 5,
    day: 15,
    hour: 19,
    minute: 30,
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 5.5
};

// We will force match chart properties for the test
// In a real scenario, these are calculated from matchParams
// For this verification, we just want to see if the engine processes rules sequentially

console.log("--- Starting Rule execution audit ---");

try {
    const result = evaluatePrediction(playerBirthChart, matchParams);

    console.log("\nBatting Rules Applied:");
    result.batting.rules.forEach(r => console.log(` - ${r.en}`));
    console.log(`Total Batting Score: ${result.batting.score}`);

    console.log("\nBowling Rules Applied:");
    result.bowling.rules.forEach(r => console.log(` - ${r.en}`));
    console.log(`Total Bowling Score: ${result.bowling.score}`);

    console.log("\n--- Audit Complete ---");
} catch (error) {
    console.error("Error during prediction:", error.message);
}
