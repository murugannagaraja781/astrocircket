const { evaluatePrediction } = require('./utils/ruleEngine');

// Beth Mooney Data (From previous step)
const playerChart = {
    planets: {
        "Sun": { longitude: 269.82, signId: 9 },
        "Moon": { longitude: 294.52, signId: 10, nakshatra: "Dhanishta", nakLord: "Mars", signLord: "Saturn" },
        "Mars": { longitude: 265.26, signId: 9 },
        "Mercury": { longitude: 276.20, signId: 10 },
        "Jupiter": { longitude: 197.82, signId: 7 },
        "Venus": { longitude: 269.08, signId: 9 },
        "Saturn": { longitude: 304.55, signId: 11 },
        "Rahu": { longitude: 216.61, signId: 8 },
        "Ketu": { longitude: 36.61, signId: 2 }
    }
};

// Mock Match Data for HASTA Nakshatra
// Hasta: Virgo (Sign 6), Lord Mercury. Star Lord: Moon.
// We need to set Match Moon to Virgo (Hasta range: 10° - 23°20' in Virgo -> 150+10 = 160 to 173.33)
const MATCH_MOON_LONGITUDE = 165; // Approx middle of Hasta

const matchChart = {
    planets: {
        "Sun": 280,
        "Moon": { longitude: MATCH_MOON_LONGITUDE, signId: 6, nakshatra: "Hasta", nakLord: "Moon", signLord: "Mercury" },
        // Transit positions for other planets - Arbitrary for now unless looking for conjunctions
        // Let's put Match Rasi Lord (Mercury) in a neutral place, say Libra (7)
        "Mercury": { longitude: 190, signId: 7 },
        "Mars": { longitude: 200, signId: 7 },
        "Jupiter": { longitude: 100, signId: 4 },
        "Venus": { longitude: 300, signId: 11 },
        "Saturn": { longitude: 330, signId: 11 },
        "Rahu": { longitude: 50, signId: 2 },
        "Ketu": { longitude: 230, signId: 8 },
        "Asc": { longitude: 10, signId: 1, lord: "Mars" } // Aries Asc
    },
    ascendant: 10,
    ascSign: { id: 1, lord: "Mars" },
    moon: { longitude: MATCH_MOON_LONGITUDE, signId: 6, nakshatra: "Hasta", nakLord: "Moon", signLord: "Mercury" }
};

// We need to re-implement the core logic or use the exported function if we can mock the input correctly.
// Since `evaluatePrediction` takes (playerBirthChart, matchParams) and calculates positions internally,
// we can't easily inject our Mock Match Chart into it directly without modifying the file or mocking `calculatePlanetaryPositions`.

// Instead, I will write a script that MANUALLY checks the rules against these identities, 
// checking for the "Specific Rules" block in `ruleEngine.js` effectively.

function checkRules() {
    console.log("=== Checking Rules for Beth MOONEY in HASTA Match ===");

    // Player Details
    const pRasiLord = "Saturn";
    const pStarLord = "Mars";
    const pStar = "Dhanishta";
    const pRasi = "Capricorn"; // Sign 10

    // Match Details (Hasta)
    const mStar = "Hasta";
    const mStarLord = "Moon";
    const mRasiLord = "Mercury";
    const mSignId = 6; // Virgo

    console.log(`Player: Rasi Lord=${pRasiLord}, Star Lord=${pStarLord}`);
    console.log(`Match: Star=${mStar} (Lord=${mStarLord}), Sign=Virgo (Lord=${mRasiLord})`);

    console.log("\n--- Checking General Rules ---");

    // Rule 1: Zig-Zag (Match Rasi Lord == Player Star Lord AND Match Star Lord == Player Rasi Lord)
    // Mercury == Mars? AND Moon == Saturn? -> False
    if (mRasiLord === pStarLord && mStarLord === pRasiLord) console.log("✅ Rule 1: Zig-Zag Triggered");
    else console.log("❌ Rule 1: Zig-Zag NOT Triggered");

    // Rule 2: Direct (Match Rasi == Player Rasi AND Match Star == Player Star)
    // Mercury == Saturn? AND Moon == Mars? -> False
    if (mRasiLord === pRasiLord && mStarLord === pStarLord) console.log("✅ Rule 2: Direct Triggered");
    else console.log("❌ Rule 2: Direct NOT Triggered");

    // Rule 3: Star (Match Star Lord == Player Rasi OR Mach Star Lord == Player Star)
    // Moon == Saturn? OR Moon == Mars? -> False
    if (mStarLord === pRasiLord || mStarLord === pStarLord) console.log("✅ Rule 3: Star Triggered");
    else console.log("❌ Rule 3: Star NOT Triggered");

    // Rule 9 (Double Lord Conjunction): Requires Transit positions.
    // We didn't set specific transit conjunctions for Mercury + Moon.
    console.log("❌ Rule 9: Depends on daily transit conjunction (Not set in this mock)");

    console.log("\n--- Checking Specific Rules (Switch Case) ---");
    // Checking known specific rules for HASTA

    switch (mStar) {
        case 'Ashwini': console.log("Checked Ashwini"); break;
        case 'Bharani': console.log("Checked Bharani"); break;
        case 'Hasta':
            console.log("Checking Hasta specific rules...");
            // NOTE: I am simulating what IS in the code.
            // Based on my view of ruleEngine.js, there IS NO CASE for Hasta.
            // So this should not print anything if I was running the real code.
            // But since I am writing this script, I will explicitly log if I find it missing.
            console.log("⚠️ No specific rules defined for 'Hasta' in the codebase switch statement.");
            break;
        default:
            console.log("Specific Rule check: No match found for 'Hasta'.");
    }

    console.log("\n--- Conclusion ---");
    console.log("For Beth Mooney (Saturn/Mars) in Hasta (Mercury/Moon):");
    console.log("No General Rules (1, 2, 3) trigger based on lord identities.");
    console.log("No Specific Rules exist for Hasta in the rule engine.");
    console.log("Prediction would rely purely on daily transit house placements/conjunctions.");
}

checkRules();
