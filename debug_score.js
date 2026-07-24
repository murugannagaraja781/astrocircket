const { evaluateBatsman } = require('./client/src/utils/predictionRules.js');
const fs = require('fs');

const player = JSON.parse(fs.readFileSync('./server/mitchell_owen.json', 'utf8'));

// Mock Match Chart
const matchChart = {
    planets: {
        "Moon": { sign: "Leo", nakshatra: "Magha" },
        "Asc": { sign: "Leo" },
        "Sun": { sign: "Leo" }, // Match Rasi Lord usually in Rasi
        "Mars": { sign: "Leo" } // Let's assume for Rule 6
    }
};

// Re-map player for the evaluator if needed
const playerChart = {
    ...player,
    planets: player.birthChart.planets
};

const result = evaluateBatsman(playerChart, matchChart);
console.log('--- Evaluation for Mitchell Owen ---');
console.log('Score:', result.score);
console.log('Label:', result.label);
console.log('Report:');
result.report.forEach(r => console.log(`- ${r.en} (${r.ta})`));
