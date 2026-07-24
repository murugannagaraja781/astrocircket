const mongoose = require('mongoose');
const Player = require('./models/Player');
const { getLagnaTimeline } = require('./utils/astroCalculator');
const { evaluatePrediction } = require('./utils/ruleEngine');

require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/astrocricket', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    try {
        const player = await Player.findOne({ name: { $regex: /alyssa healy/i } });
        if (!player) {
            console.log("Player not found");
            process.exit(1);
        }

        console.log(`Found Player: ${player.name} (${player.role})`);

        // Use the Ashlesha Match Date from previous test (2024-05-14 17:00)
        const ashleshaMatch = {
            year: 2024, month: 5, day: 14, hour: 17, minute: 0,
            latitude: 13, longitude: 80, timezone: 5.5
        };

        const lagnaTimeline = getLagnaTimeline(
            ashleshaMatch.year, ashleshaMatch.month, ashleshaMatch.day,
            ashleshaMatch.hour, ashleshaMatch.minute,
            ashleshaMatch.latitude, ashleshaMatch.longitude,
            ashleshaMatch.timezone, 4
        );
        ashleshaMatch.matchLagnas = lagnaTimeline;

        const chartRoot = player.birthChart.data || player.birthChart;
        const planetsData = chartRoot.positions || chartRoot.rawPlanets || chartRoot.planets;
        const playerChart = { planets: planetsData, role: player.role };

        const result = await evaluatePrediction(playerChart, ashleshaMatch);

        console.log("\n=== PREDICTION RESULT ===");
        console.log(`Batting Score: ${result.bat.score}`);
        console.log(`Batting UI Report:`);
        result.bat.report.forEach(r => console.log(`  - ${r.en}`));

        console.log(`\nBowling Score: ${result.bowl.score}`);
        console.log(`Bowling UI Report:`);
        result.bowl.report.forEach(r => console.log(`  - ${r.en}`));

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

run();
