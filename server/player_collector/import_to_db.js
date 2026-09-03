const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://murugannagaraja781_db_user:NewLife2025@cluster0.tp2gekn.mongodb.net/circket';
const PARSED_PATH = path.join(__dirname, 'parsed_players.json');
const Player = require('./models/Player');

async function importPlayers() {
 console.log('Connecting to MongoDB...');
 await mongoose.connect(MONGO_URI);
 console.log('Connected!\n');

 const parsed = JSON.parse(fs.readFileSync(PARSED_PATH, 'utf-8'));
 console.log(`Loaded ${parsed.length} players from PDF\n`);

 const existingPlayers = await Player.find({}).lean();
 const existingMap = new Map();
 existingPlayers.forEach(p => {
 const key = p.name.toLowerCase().trim();
 existingMap.set(key, p);
 });

 console.log(`Existing DB players: ${existingMap.size}`);

 let added = 0, updated = 0, skipped = 0;

 for (const pdfPlayer of parsed) {
 if (!pdfPlayer.rosterName || pdfPlayer.rosterName.length < 3) continue;

 const name = pdfPlayer.rosterName.trim();
 const nameLower = name.toLowerCase();
 const existing = existingMap.get(nameLower);

 if (existing) {
 // Update only if fields are missing
 const updates = {};
 if (pdfPlayer.dob && !existing.dob) updates.dob = pdfPlayer.dob;
 if (pdfPlayer.birthPlace && !existing.birthPlace) updates.birthPlace = pdfPlayer.birthPlace;
 if (pdfPlayer.country && !existing.birthPlace) updates.birthPlace = pdfPlayer.birthPlace;

 if (Object.keys(updates).length > 0) {
 await Player.findByIdAndUpdate(existing._id, { $set: updates });
 updated++;
 console.log(` Updated: ${name} | DOB: ${updates.dob || 'no'} | Place: ${updates.birthPlace || 'no'}`);
 } else {
 skipped++;
 }
 } else {
 // Add new player with default birth time 9:00 AM
 const newPlayer = {
 name: name,
 dob: pdfPlayer.dob || '',
 birthTime: '09:00',
 birthPlace: pdfPlayer.birthPlace || pdfPlayer.country || '',
 latitude: pdfPlayer.birthPlace ? 0 : 13.0827, // Will be auto-filled if place exists
 longitude: pdfPlayer.birthPlace ? 0 : 80.2707,
 timezone: 5.5,
 role: 'BAT',
 league: pdfPlayer.league,
 manualStatus: pdfPlayer.status || ''
 };

 await Player.create(newPlayer);
 added++;
 existingMap.set(nameLower, newPlayer);
 }
 }

 console.log('\n=== Import Complete ===');
 console.log(` Added: ${added}`);
 console.log(` Updated: ${updated}`);
 console.log(` Skipped (already complete): ${skipped}`);
 console.log(`\nTotal in DB: ${await Player.countDocuments()}`);

 await mongoose.disconnect();
 process.exit(0);
}

importPlayers().catch(err => { console.error(err); process.exit(1); });
