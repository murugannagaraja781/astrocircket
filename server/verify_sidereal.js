const { calculatePlanetaryPositions, formatDegree, calculateSign } = require('./utils/astroCalculator');

const runTest = () => {
    // Test Date: 2025-12-30 12:00
    // Tropical Sun: ~Capricorn (279 deg)
    // Sidereal Sun: ~Sagittarius (255 deg)

    // Saturn Tropical: ~Pisces/Aries border?
    // Saturn Sidereal: ~Aquarius/Pisces

    const result = calculatePlanetaryPositions(2025, 12, 30, 12, 0, 13.0, 80.0, 5.5);

    console.log('--- SIDEREAL CALCULATION TEST ---');
    console.log('Sun Longitude:', result.planets.Sun.toFixed(2));
    console.log('Sun Sign:', calculateSign(result.planets.Sun).name);
    console.log('Sun Sign (Tamil):', calculateSign(result.planets.Sun).tamil);

    console.log('Moon Longitude:', result.planets.Moon.toFixed(2));
    console.log('Moon Sign:', calculateSign(result.planets.Moon).name);

    console.log('Ayanamsa Used:', result.ayanamsaVal.toFixed(2));
}

runTest();
