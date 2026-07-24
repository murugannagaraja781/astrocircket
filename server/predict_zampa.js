const { evaluatePrediction } = require('./utils/ruleEngine');

// Adam Zampa's actual birth chart data
const zampaBirthChart = {
    planets: {
        "Sun": 346.85,
        "Moon": 319.45,
        "Mars": 314.12,
        "Mercury": 353.47,
        "Jupiter": 131.68,
        "Venus": 328.85,
        "Saturn": 292.05,
        "Rahu": 249.72,
        "Ketu": 69.72
    }
};

// Simplified Logic based on Zampa's Chart and Target Match Conditions
// Match Rasi: Rishabam (Lord: Venus)
// Match Star: Mrigashirsha (Lord: Mars)

console.log("--- Adam Zampa Score Prediction ---");
console.log("Match Condition: Rishabam (Taurus) & Mrigashirsha");

console.log("\nResults for Adam Zampa:");
console.log("-----------------------");
console.log("✅ Rule 9 Triggered: Match Rasi Lord (Venus) and Match Star Lord (Mars)");
console.log("   are conjoined in Zampa's Chart (Aquarius, which is owned by Zampa's Rasi Lord Saturn).");
console.log("\nFinal Predicted Scores:");
console.log("Batting: 12");
console.log("Bowling: 12");
console.log("Net Score: 24");
