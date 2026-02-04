// Debug: Check Adam Zampa Rule 9
const { evaluatePrediction } = require('./utils/ruleEngine');

// Adam Zampa Birth Data (from database)
// DOB: 1992-03-31, Time: 10:00, Place: Shellharbour
const zampaChart = {
    planets: {
        "Sun": 346.85,
        "Moon": 319.45, // Aquarius
        "Mars": 314.12, // Aquarius (Sign 11)
        "Mercury": 353.47,
        "Jupiter": 131.68,
        "Venus": 328.85, // Aquarius (Sign 11)
        "Saturn": 292.05, // Capricorn
        "Rahu": 249.72,
        "Ketu": 69.72
    }
};

// Match Params for Today (Jan 29, 2026)
// You need to set the actual match nakshatra details here
const matchParams = {
    year: 2026,
    month: 1,
    day: 29,
    hour: 14,
    minute: 0,
    latitude: 28.6139, // Delhi
    longitude: 77.2090,
    timezone: 5.5
};

console.log("=== ADAM ZAMPA RULE 9 DEBUG ===\n");

try {
    const result = evaluatePrediction(zampaChart, matchParams);

    console.log("Match Rasi Lord:", "Check from matchChart.moon.signLord");
    console.log("Match Star Lord:", "Check from matchChart.moon.nakLord");

    console.log("\n=== BATTING RULES ===");
    result.batting.rules.forEach(r => console.log("  -", r.en));
    console.log("Batting Score:", result.batting.score);

    console.log("\n=== BOWLING RULES ===");
    result.bowling.rules.forEach(r => console.log("  -", r.en));
    console.log("Bowling Score:", result.bowling.score);

    console.log("\n=== RULE 9 CHECK ===");
    const hasRule9Bat = result.batting.rules.some(r => r.en?.includes("Rule 9"));
    const hasRule9Bowl = result.bowling.rules.some(r => r.en?.includes("Rule 9"));
    console.log("Rule 9 in Batting:", hasRule9Bat);
    console.log("Rule 9 in Bowling:", hasRule9Bowl);

} catch (e) {
    console.error("Error:", e.message);
}
