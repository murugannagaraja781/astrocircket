const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Player = require('./models/Player');
const fs = require('fs');

dotenv.config();

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('debug_log.txt', msg + '\n');
};

const getPlayers = async () => {
    try {
        log('Starting script...');
        log(`Connecting to: ${process.env.MONGO_URI.split('@')[1]}`); // Mask credentials

        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        log('MongoDB Connected successfully');

        log('Fetching all players...');
        const players = await Player.find({});
        log(`Total Players Found: ${players.length}`);

        if (players.length > 0) {
            fs.writeFileSync('players_dump.json', JSON.stringify(players, null, 2));
            log('Player details written to players_dump.json');
        } else {
            log('No players found in the database.');
        }

        mongoose.connection.close();
        log('Connection closed');
    } catch (err) {
        log(`Error: ${err.message}`);
        process.exit(1);
    }
};

getPlayers();
