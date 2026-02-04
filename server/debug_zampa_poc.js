// Standalone Proof of Concept: Rule 9 for Zampa
// Uses the exact logic from the Rule Engine but self-contained to avoid require() errors.

// --- MOCKED HELPERS ---
const SIGNS = {
    Aries: 1, Taurus: 2, Gemini: 3, Cancer: 4, Leo: 5, Virgo: 6,
    Libra: 7, Scorpio: 8, Sagittarius: 9, Capricorn: 10, Aquarius: 11, Pisces: 12
};

const OWNERSHIP = {
    'Mars': [1, 8], 'Venus': [2, 7], 'Mercury': [3, 6], 'Moon': [4],
    'Sun': [5], 'Jupiter': [9, 12], 'Saturn': [10, 11], 'Rahu': [11], 'Ketu': [5] // Simplified for calc
};
const getOwnedSigns = (p) => OWNERSHIP[p] || [];
const getSignId = (lng) => Math.floor((lng % 360) / 30) + 1; // Approx
const isConjoined = (p1, p2) => p1 && p2 && p1.signId === p2.signId;

// --- ZAMPA DATA ---
const zampaPlanets = {
    "Mars": { signId: 11 }, // Aquarius
    "Venus": { signId: 11 }, // Aquarius
    // Other planets irrelevant for this specific rule test
};

// --- MATCH DATA (Trigger Scenario) ---
// Match Rasi Lord: Mars
// Match Star Lord: Venus
// Rule 9 requires: Match Lords conjoined in Player Chart (In a house owned by Player Lords)
const matchRasiLord = 'Mars';
const matchStarLord = 'Venus';

// --- PLAYER LORDS ---
// Zampa Rasi Lord: Saturn
// Zampa Star Lord: Saturn (Override)
const playerRasiLord = 'Saturn';
const playerStarLord = 'Saturn';


// --- RULE 9 LOGIC EXECUTION ---
console.log(`Checking Rule 9 for Match Lords: ${matchRasiLord} & ${matchStarLord}`);
console.log(`Player Lords: ${playerRasiLord} & ${playerStarLord}`);

// 1. Determine Allowed Houses (Owned by Player Lords)
const pRasiLordSigns = getOwnedSigns(playerRasiLord); // Saturn -> [10, 11]
const pStarLordSigns = getOwnedSigns(playerStarLord); // Saturn -> [10, 11]
const allowedSigns = [...new Set([...pRasiLordSigns, ...pStarLordSigns])];
console.log("Allowed Signs (Saturn's Houses):", allowedSigns);

// 2. Get Match Lord Positions in Player Chart
const matchRasiLordPosInPlayer = zampaPlanets[matchRasiLord]; // Mars in Aquarius (11)
const matchStarLordPosInPlayer = zampaPlanets[matchStarLord]; // Venus in Aquarius (11)

console.log(`Mars in Player Chart: Sign ${matchRasiLordPosInPlayer?.signId}`);
console.log(`Venus in Player Chart: Sign ${matchStarLordPosInPlayer?.signId}`);

// 3. Check Conjunction
const isConjoinedInPlayerChart = matchRasiLordPosInPlayer && matchStarLordPosInPlayer &&
    matchRasiLordPosInPlayer.signId === matchStarLordPosInPlayer.signId;

// 4. Check if in Allowed House
const isInPlayerLordHouse = matchRasiLordPosInPlayer && allowedSigns.includes(matchRasiLordPosInPlayer.signId);

console.log(`Is Conjoined? ${isConjoinedInPlayerChart}`);
console.log(`Is in Player Lord House? ${isInPlayerLordHouse}`);

if (isConjoinedInPlayerChart && isInPlayerLordHouse) {
    console.log("SUCCESS: Rule 9 TRIGGERED!");
} else {
    console.log("FAIL: Rule 9 Did Not Trigger.");
}
