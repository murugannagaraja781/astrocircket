const { calculatePlanetaryPositions } = require('./utils/astroCalculator');
const { evaluatePrediction } = require('./utils/ruleEngine');

// Muhammad Waseem Birth Data
// Feb 12, 1994, Multan, Pakistan
const playerChart = calculatePlanetaryPositions(1994, 2, 12, 12, 0, 30.1575, 71.5249, 5.0);

// Ardra Match Date (Jan 23, 2024)
const matchParams = {
    year: 2024, month: 1, day: 23, hour: 12, minute: 0,
    latitude: 13.0827, longitude: 80.2707, timezone: 5.5
};

const result = evaluatePrediction(playerChart, matchParams);
result.playerPlanets = playerChart.planets;
result.playerLagna = playerChart.ascendant;

const fs = require('fs');
fs.writeFileSync('waseem_result.json', JSON.stringify(result, null, 2));
console.log('Result saved to waseem_result.json');
