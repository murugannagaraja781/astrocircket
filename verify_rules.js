const { evaluatePrediction } = require('./server/utils/ruleEngine');
const { calculatePlanetaryPositions, calculateSign, calculateNakshatra } = require('./server/utils/astroCalculator');

// Mock Data Generators
const createMockChart = (overrides = {}) => {
    const basePlanets = {
        Sun: 0, Moon: 0, Mars: 0, Mercury: 0, Jupiter: 0, Venus: 0, Saturn: 0, Rahu: 0, Ketu: 180
    };
    return {
        planets: { ...basePlanets, ...overrides }
    };
};

const runTest = (name, matchParams, playerPlanets, expectedRulePart, expectedScore) => {
    console.log(`\n-----------------------------------`);
    console.log(`TEST: ${name}`);
    try {
        const result = evaluatePrediction(
            playerPlanets,
            matchParams
        );

        const allRules = [...result.batting.rules, ...result.bowling.rules];
        const ruleFound = allRules.some(r => r.includes(expectedRulePart));

        if (ruleFound) {
            console.log(`✅ Rule Found: "${expectedRulePart}"`);
        } else {
            console.log(`❌ Rule NOT Found. Got:`, allRules);
        }

        const scoreFound = (result.batting.score + result.bowling.score) === expectedScore;
        // Note: Score check might be tricky if multiple rules trigger, so we prioritize rule presence.
        // But for isolated tests, score should match.

        if (result.batting.score + result.bowling.score === expectedScore) {
            console.log(`✅ Score Matches: ${expectedScore}`);
        } else {
            console.log(`⚠️ Score Mismatch. Expected ${expectedScore}, Got ${result.batting.score + result.bowling.score}`);
        }

    } catch (e) {
        console.error(`❌ ERROR:`, e.message);
    }
};

// 1. Ashwini: Mars Exalted (Capricorn - Sign 10. Longitude ~280)
// Match Star needs to be Ashwini (0-13.20 deg).
// Moon at 5 deg (Aries) = Ashwini.
const matchAshwini = {
    year: 2024, month: 1, day: 1, hour: 12, minute: 0, latitude: 13, longitude: 80, timezone: 5.5
};
// We can't easily force match star via params without calculating, so strict integration test is hard.
// BUT, we can mock the internal calc if we assume the engine works, OR finding a date with Ashwini.
// Better: We can just unit test evaluatePrediction logic if we can mock the internal Match Chart.
// ACTUALLY, evaluatePrediction calculates match chart inside.
// Finding a date with Ashwini Moon: April 14 2024 roughly? Or just use a known date.
// Let's rely on finding a date or just hardcoding params that give Ashwini?
// Actually, since I can't easily predict the date for a star in this script without using the calc first...
// I'll assume 2026-01-13 (Today) and check what star it is, then adjust accordingly?
// Or I can calculate a date.

// Alternative: I will modify the script to loop days until it finds the Match Star "Ashwini", then test.

const findDateForStar = (targetStar) => {
    let d = new Date(2025, 0, 1);
    for (let i = 0; i < 365; i++) {
        const { planets } = calculatePlanetaryPositions(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, 13, 80, 5.5);
        const moon = calculateNakshatra(planets.Moon).name;
        const sign = calculateSign(planets.Moon).id;
        // console.log(d.toISOString(), moon);
        if (moon === targetStar) return {
            year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: 12, minute: 0, latitude: 13, longitude: 80, timezone: 5.5,
            signId: sign
        };
        d.setDate(d.getDate() + 1);
    }
    return null;
};

const runSuite = () => {
    // Test 1: Ashwini - Exalted Mars
    const ashwiniParams = findDateForStar('Ashwini');
    if (ashwiniParams) {
        // Exalted Mars is in Capricorn (Line 270-300). Exact degree 298.
        runTest('Ashwini - Exalted Mars (+8)', ashwiniParams, createMockChart({ Mars: 298 }), 'Ashwini: Mars Exalted', 8);
    } else { console.log("Skipping Ashwini due to date find fail"); }

    // Test 2: Bharani - Venus + Mercury Conjoined
    const bharaniParams = findDateForStar('Bharani');
    if (bharaniParams) {
        // Venus and Mercury in same sign (e.g. Aries 10, 20)
        runTest('Bharani - Venus+Mercury (-12)', bharaniParams, createMockChart({ Venus: 10, Mercury: 20 }), 'Bharani: Venus & Mercury Conjoined', -12);
    }

    // Test 3: Rohini - Debilitated Moon
    const rohiniParams = findDateForStar('Rohini');
    if (rohiniParams) {
        // Moon Debilitated in Scorpio (Sign 8, ~213 deg). Wait, Player Moon!
        runTest('Rohini - Debilitated Moon (+8)', rohiniParams, createMockChart({ Moon: 213 }), 'Rohini: Moon Debilitated', 8);
    }

    // Test 4: Uthiradam (Capricorn) - Match Moon in Capricorn
    // Uttara Ashadha spans Sagittarius and Capricorn.
    // We need to find date where Moon is in Capricorn (Sign 10) AND Nakshatra is Uttara Ashadha.
    // 2,3,4 Padas are in Capricorn.
    let uaParams = null;
    let d = new Date(2025, 0, 1);
    for (let i = 0; i < 365; i++) {
        const { planets } = calculatePlanetaryPositions(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, 13, 80, 5.5);
        const nak = calculateNakshatra(planets.Moon);
        const sign = calculateSign(planets.Moon);
        if (nak.name === 'Uttara Ashadha' && sign.id === 10) {
            uaParams = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: 12, minute: 0, latitude: 13, longitude: 80, timezone: 5.5 };
            break;
        }
        d.setDate(d.getDate() + 1);
    }

    if (uaParams) {
        // Rule: Rasi Lord Moon -> +12. Player Rasi Lord is Moon if Player Rasi is Cancer.
        // So Player Moon longitude in Cancer (90-120).
        runTest('Uthiradam (Capricorn) - Rasi Lord Moon (+12)', uaParams, createMockChart({ Moon: 100 }), 'Uthiradam (Capricorn): Rasi Lord Moon', 12);
    } else {
        console.log("Could not find Uttara Ashadha in Capricorn date");
    }

};

runSuite();
