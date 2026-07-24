const { calculatePlanetaryPositions, calculateNakshatra } = require('./utils/astroCalculator');

for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 28; day++) {
        const { planets } = calculatePlanetaryPositions(2024, month, day, 12, 0, 13.0827, 80.2707, 5.5);
        const moonLng = planets.Moon;
        const nak = calculateNakshatra(moonLng);
        if (nak.name === 'Ardra') {
            console.log(`Found Ardra: ${month}/${day}/2024 - Lord: ${nak.lord}`);
            process.exit(0);
        }
    }
}
