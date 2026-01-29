const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Player = require('./models/Player');

dotenv.config();

const findPlayer = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB Connected');

        const searchQuery = 'Beth Mooney';
        console.log(`Searching for player with name containing: ${searchQuery}`);

        // Case-insensitive search
        const players = await Player.find({
            name: { $regex: searchQuery, $options: 'i' }
        });

        const fs = require('fs');
        let output = '';

        if (players.length > 0) {
            output += `Found ${players.length} matching players.\n\n`;
            players.forEach(p => {
                output += '------------------------------------------------\n';
                output += `Name: ${p.name}\n`;
                output += `Role: ${p.role}\n`;
                output += `ID: ${p.id}\n`;
                if (p.birthChart) {
                    output += `Rasi: ${p.birthChart.rasi}\n`;
                    output += `Nakshatra: ${p.birthChart.nakshatra}\n`;
                    output += `Rasi Lord: ${p.birthChart.rasiLord}\n`;
                    output += `Nakshatra Lord: ${p.birthChart.nakshatraLord}\n`;
                    output += `Chart Details: ${JSON.stringify(p.birthChart, null, 2)}\n`;
                } else {
                    output += `Birth Chart not found in DB object.\n`;
                }
                output += '------------------------------------------------\n';
            });
        } else {
            output += 'No players found matching the name.\n';
            // Dump all names just in case
            const allPlayers = await Player.find({}, 'name');
            if (allPlayers.length > 0) {
                output += 'Existing Players: ' + allPlayers.map(p => p.name).join(', ');
            } else {
                output += 'Database is completely empty of players.';
            }
        }

        fs.writeFileSync('player_details.txt', output);
        console.log('Results written to player_details.txt');

        mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

findPlayer();
