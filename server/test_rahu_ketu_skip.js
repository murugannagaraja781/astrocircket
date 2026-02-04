const { evaluatePrediction } = require('./utils/ruleEngine');
const fs = require('fs');

const playerChart = {
    planets: {
        Moon: { longitude: 60 }, // Gemini
        Sun: { longitude: 0 },
        Mars: { longitude: 100 }, // Cancer (Neecham)
        Mercury: { longitude: 61 }, // Gemini
        Jupiter: { longitude: 30 },
        Venus: { longitude: 63 }, // Gemini
        Saturn: { longitude: 50 },
        Rahu: { longitude: 62 }, // Gemini
        Ketu: { longitude: 242 }
    }
};

// Case 1: Regular Match Star (Rohini - Moon)
const matchParamsRegular = {
    year: 2024, month: 5, day: 15, hour: 10, minute: 0,
    latitude: 13.0827, longitude: 80.2707, timezone: 5.5
};

// Case 2: Rahu/Ketu Match Star (Ardra - Rahu)
const matchParamsRahuKetu = {
    year: 2024, month: 1, day: 23, hour: 12, minute: 0,
    latitude: 13.0827, longitude: 80.2707, timezone: 5.5
};

try {
    const result1 = evaluatePrediction(playerChart, matchParamsRegular);
    const result2 = evaluatePrediction(playerChart, matchParamsRahuKetu);

    const results = {
        regular: {
            matchStar: result1.matchStar,
            matchStarLord: result1.matchStarLord,
            isMatchStarLordRahuKetu: result1.isMatchStarLordRahuKetu,
            batting: result1.batting.rules.map(r => r.en),
            battingScore: result1.batting.score,
            battingStatus: result1.batting.status,
            bowling: result1.bowling.rules.map(r => r.en),
            bowlingScore: result1.bowling.score,
            bowlingStatus: result1.bowling.status
        },
        rahuKetu: {
            matchStar: result2.matchStar,
            matchStarLord: result2.matchStarLord,
            isMatchStarLordRahuKetu: result2.isMatchStarLordRahuKetu,
            batting: result2.batting.rules.map(r => r.en),
            battingScore: result2.batting.score,
            battingStatus: result2.batting.status,
            bowling: result2.bowling.rules.map(r => r.en),
            bowlingScore: result2.bowling.score,
            bowlingStatus: result2.bowling.status
        }
    };

    fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
    console.log("Results saved to test_results.json");
} catch (error) {
    console.error("ERROR during evaluation:");
    console.error(error.message);
    console.error(error.stack);
}
