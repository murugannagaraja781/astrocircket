// Standalone Verification: Rule 9 for Zampa
const { evaluatePrediction } = require('./utils/ruleEngine');

// 1. Zampa Data (Approx) - Mars & Venus in Aquarius
// Zampa Rasi/Star Lord = Saturn (Override)
// Saturn owns Aquarius (11).
// Mars & Venus are in Sign 11.
const zampaPlanets = {
    "Sun": 346.85,
    "Moon": 319.45,
    "Mars": 314.12, // Aquarius
    "Mercury": 353.47,
    "Jupiter": 131.68,
    "Venus": 328.85, // Aquarius
    "Saturn": 292.05,
    "Rahu": 249.72,
    "Ketu": 69.72
};
// Make playerChart structure for engine
const playerChartMock = { planets: zampaPlanets };

// 2. Mock Match Chart (Trigger Condition)
// Match Rasi Lord = 'Mars', Match Star Lord = 'Venus'.
const matchChartMock = {
    planets: { "Moon": 20.0 },
    ascSign: { id: 1, lord: 'Mars' },
    moon: {
        longitude: 20.0,
        signId: 1,
        signLord: 'Mars',
        nakshatra: 'Bharani',
        nakLord: 'Venus'
    }
};

// 3. Run
console.log("Analyzing Zampa vs Match (Mars/Venus) for Rule 9...");
try {
    const r = evaluatePrediction(playerChartMock, matchChartMock);

    // Check if Rule 9 is in rules list
    const hasRule9 = r.batting.rules.some(x => x.en.includes("Rule 9")) || r.bowling.rules.some(x => x.en.includes("Rule 9"));

    console.log("Rule 9 Triggered:", hasRule9);
    console.log(JSON.stringify(r.batting.rules, null, 2));
    console.log(JSON.stringify(r.bowling.rules, null, 2));

} catch (e) {
    console.error("Execution Error:", e);
}
