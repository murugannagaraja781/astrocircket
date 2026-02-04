const { evaluatePrediction } = require('./server/utils/ruleEngine');

// Mock data
const playerChart = {
    planets: {
        "Moon": { longitude: 280, signName: "Capricorn", signLord: "Saturn", nakshatra: "Shravana", nakLord: "Moon" },
        "Saturn": { longitude: 310, signName: "Aquarius", signLord: "Saturn" }
    }
};

const matchParams = {
    year: 2024, month: 6, day: 15, hour: 10, minute: 0,
    latitude: 13.08, longitude: 80.27, timezone: "Asia/Kolkata",
    // Match starts at 10 AM
    // Suppose Batting starts at 11 AM (Lagna might change)
    // Suppose Bowling starts at 2 PM (Lagna definitely changes)
    battingHour: 11, battingMinute: 0,
    bowlingHour: 14, bowlingMinute: 0
};

console.log("--- Testing Dynamic Lagna Logic ---");

const result = evaluatePrediction(playerChart, matchParams);

console.log("\n--- Dynamic Lagna Result ---");
console.log("Batting Rules:", JSON.stringify(result.batting.rules, null, 2));
console.log(`Batting Score: ${result.batting.score}`);

console.log("\nBowling Rules:", JSON.stringify(result.bowling.rules, null, 2));
console.log(`Bowling Score: ${result.bowling.score}`);

// Compare with default (no phase times)
console.log("\n--- Testing Default Lagna (Match Start Time) ---");
const matchParamsDefault = { ...matchParams, battingHour: undefined, bowlingHour: undefined };
const resultDefault = evaluatePrediction(playerChart, matchParamsDefault);
console.log(`Default Batting Score: ${resultDefault.batting.score}`);
console.log(`Default Bowling Score: ${resultDefault.bowling.score}`);
