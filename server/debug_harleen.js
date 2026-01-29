const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { getPrediction } = require('./utils/ruleEngine');
const Player = require('./models/Player');
const fs = require('fs');

dotenv.config();

const mockMatch = {
    date: '2025-06-25',
    time: '14:30',
    place: 'Chennai, India',
    city: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 'Asia/Kolkata',
    matchType: 'T20',
};

const runDebug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const player = await Player.findOne({ name: { $regex: 'Harleen', $options: 'i' } });

        if (!player) {
            console.log('Player Harleen not found');
            return;
        }

        let logOutput = '';
        logOutput += '--- Player Details ---\n';
        logOutput += `Name: ${player.name}\n`;
        logOutput += `Rasi Lord: ${player.birthChart?.rasiLord}\n`;
        logOutput += `Star Lord: ${player.birthChart?.nakshatraLord}\n`;

        logOutput += '\n--- Running Prediction ---\n';
        const prediction = await getPrediction(player, mockMatch);

        logOutput += '\n--- Batting Rules Triggered ---\n';
        prediction.batting.logs.forEach(log => logOutput += log + '\n');

        logOutput += '\n--- Bowling Rules Triggered ---\n';
        prediction.bowling.logs.forEach(log => logOutput += log + '\n');

        fs.writeFileSync('debug_harleen_log.txt', logOutput);
        console.log('Debug Output Written to debug_harleen_log.txt');

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

runDebug();
