const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://murugannagaraja781_db_user:NewLife2025@cluster0.tp2gekn.mongodb.net/circket';
const OUTPUT_PATH = path.join(__dirname, '../client/src/data/player.json');

const Player = require('./models/Player');

async function exportPlayers() {
 try {
 console.log('Connecting to MongoDB...');
 await mongoose.connect(MONGO_URI);
 console.log('Connected!');

 const count = await Player.countDocuments();
 console.log(`Total players in DB: ${count}`);

 const players = await Player.find({}).lean();
 console.log(`Fetched ${players.length} players`);

 // Clean up for JSON export (remove MongoDB internal fields)
 const cleanPlayers = players.map(p => {
 const { __v, _id, ...rest } = p;
 return rest;
 });

 fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cleanPlayers, null, 2), 'utf-8');
 console.log(`\nDone! Exported to: ${OUTPUT_PATH}`);
 console.log(`File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);

 // Show sample
 if (cleanPlayers.length > 0) {
 console.log('\nSample player:');
 console.log(JSON.stringify(cleanPlayers[0], null, 2));
 }

 await mongoose.disconnect();
 console.log('\nDisconnected from DB');
 process.exit(0);
 } catch (err) {
 console.error('Error:', err.message);
 process.exit(1);
 }
}

exportPlayers();
