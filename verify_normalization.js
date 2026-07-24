const fs = require('fs');

// Mock a simple version of normalizeChart to test logic
const signLords = { "Leo": "Sun" };
const toTitleCase = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const normalizeChart = (chart) => {
    const planets = chart.planets || {};
    let moonObj = planets["Moon"] || planets["moon"] || {};
    const rashi = moonObj.sign || "Unknown";
    const nakshatra = moonObj.nakshatra || "Unknown";
    const planetPositions = { "Moon": toTitleCase(rashi) };

    const ascSign = chart.ascendant?.sign?.name || chart.ascendantSign || "Unknown";
    const ascLord = chart.ascendant?.sign?.lord || chart.ascendantLord || "Unknown";

    return {
        rashi: toTitleCase(rashi),
        nakshatra,
        planetPositions,
        ascendantSign: toTitleCase(ascSign),
        ascendantLord: toTitleCase(ascLord),
        battingLagnaSign: toTitleCase(chart.battingLagnaSign || ascSign),
        battingLagnaLord: toTitleCase(chart.battingLagnaLord || ascLord),
        bowlingLagnaSign: toTitleCase(chart.bowlingLagnaSign || ascSign),
        bowlingLagnaLord: toTitleCase(chart.bowlingLagnaLord || ascLord),
    };
};

const mitchellRaw = JSON.parse(fs.readFileSync('c:\\Users\\abina\\astro_cricket\\astrocircket\\server\\mitchell_owen.json', 'utf8'));
const matchRaw = {
    planets: { "Moon": { sign: "Leo", nakshatra: "Magha" } },
    ascendant: { sign: { name: "Leo", lord: "Sun" } }
};

console.log("Testing normalization for Match Chart (Leo)...");
const normalizedMatch = normalizeChart(matchRaw.birthChart || matchRaw);
console.log("Normalized Match:", JSON.stringify(normalizedMatch, null, 2));

if (normalizedMatch.ascendantSign === "Leo" && normalizedMatch.ascendantLord === "Sun") {
    console.log("✅ Success: Lagna correctly extracted from nested object");
} else {
    console.log("❌ Failure: Lagna NOT correctly extracted");
}

const matchFlattened = {
    planets: { "Moon": { sign: "Leo", nakshatra: "Magha" } },
    ascendantSign: "Leo",
    ascendantLord: "Sun"
};

console.log("\nTesting normalization for Flattened Match Chart...");
const normalizedFlattened = normalizeChart(matchFlattened);
console.log("Normalized Flattened:", JSON.stringify(normalizedFlattened, null, 2));

if (normalizedFlattened.ascendantSign === "Leo" && normalizedFlattened.ascendantLord === "Sun") {
    console.log("✅ Success: Lagna correctly extracted from flattened properties");
} else {
    console.log("❌ Failure: Lagna NOT correctly extracted");
}
