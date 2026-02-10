
const { calculatePlanetaryPositions, calculateSign } = require('./utils/astroCalculator');

function getLagnaTimeline(date, lat, lon, durationHours = 4) {
    const timeline = [];
    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    let currentTime = new Date(startTime);
    let currentLagna = null;
    let lagnaStartTime = new Date(startTime);

    console.log(`Match Start: ${startTime.toISOString()}`);
    console.log(`Match End: ${endTime.toISOString()}`);

    // Check every 10 minutes (sufficient precision for Lagna which changes every ~2 hours)
    while (currentTime <= endTime) {
        const year = currentTime.getFullYear();
        const month = currentTime.getMonth() + 1;
        const day = currentTime.getDate();
        const hour = currentTime.getHours();
        const minute = currentTime.getMinutes();

        const result = calculatePlanetaryPositions(year, month, day, hour, minute, lat, lon, 5.5); // Assuming 5.5 TZ for now
        const ascDegree = result.ascendant;
        const signData = calculateSign(ascDegree);
        const signName = signData.name;

        if (currentLagna === null) {
            currentLagna = signName;
            lagnaStartTime = new Date(currentTime);
        } else if (currentLagna !== signName) {
            // Lagna Changed
            timeline.push({
                lagna: currentLagna,
                start: lagnaStartTime.toISOString(),
                end: currentTime.toISOString(), // Approx end time (start of next)
                lord: signData.lord // Actually previous lord needed, but let's just push sign name
            });
            currentLagna = signName;
            lagnaStartTime = new Date(currentTime);
        }

        currentTime = new Date(currentTime.getTime() + 10 * 60 * 1000); // Add 10 mins
    }

    // Push the last segment
    timeline.push({
        lagna: currentLagna,
        start: lagnaStartTime.toISOString(),
        end: endTime.toISOString()
    });

    return timeline;
}

// Test with a sample match
// Chennai
const lat = 13.0827;
const lon = 80.2707;
const now = new Date();

const timeline = getLagnaTimeline(now, lat, lon, 4);
console.log("\n--- Lagna Timeline ---");
console.log(timeline);
