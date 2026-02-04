const { evaluatePrediction } = require('./server/utils/ruleEngine');

// Adam Zampa's actual birth chart data from previous investigation
const zampaBirthChart = {
    planets: {
        "Sun": 346.85,    // Pisces
        "Moon": 319.45,   // Aquarius
        "Mars": 314.12,   // Aquarius
        "Mercury": 353.47, // Pisces
        "Jupiter": 131.68, // Leo
        "Venus": 328.85,  // Aquarius
        "Saturn": 292.05, // Capricorn
        "Rahu": 249.72,   // Sagittarius
        "Ketu": 69.72     // Gemini
    }
};

// Match Condition: Rishabam (Taurus) & Mrigashirsha
// Sign ID: 2 (Taurus)
// Lord of Taurus: Venus
// Lord of Mrigashirsha: Mars

const matchParams = {
    year: 2026, month: 1, day: 29, hour: 12, minute: 0,
    latitude: 13, longitude: 80, timezone: 5.5
};

// Note: The internal calculatePlanetaryPositions in ruleEngine will calculate the match chart.
// To force Mrigashirsha, we might need a specific date/time, but evaluatePrediction
// also uses matchParams to derive the star.

console.log("--- Verification: Adam Zampa Fix ---");

try {
    const result = evaluatePrediction(zampaBirthChart, matchParams);

    console.log("\nBatting Score:", result.batting.score);
    console.log("Batting Rules:", result.batting.rules.map(r => r.en));

    console.log("\nBowling Score:", result.bowling.score);
    console.log("Bowling Rules:", result.bowling.rules.map(r => r.en));

    const rule9Found = result.batting.rules.some(r => r.en.includes("Rule 9"));
    if (rule9Found) {
        console.log("\n✅ SUCCESS: Rule 9 Triggered!");
    } else {
        console.log("\n❌ FAIL: Rule 9 did not trigger.");
    }

} catch (e) {
    console.error("Error during verification:", e);
}
