const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://murugannagaraja781_db_user:NewLife2025@cluster0.tp2gekn.mongodb.net/circket';
const OUTPUT_PATH = path.join(__dirname, 'players_export.xlsx');
const Player = require('./models/Player');

async function exportPlayers() {
 console.log('Connecting to MongoDB...');
 await mongoose.connect(MONGO_URI);
 console.log('Connected!\n');

 const players = await Player.find({}).sort({ name: 1 }).lean();
 console.log(`Found ${players.length} players\n`);

 const workbook = new ExcelJS.Workbook();
 const sheet = workbook.addWorksheet('Players');

 // Headers
 const headers = [
 'S.No', 'Name', 'DOB', 'Birth Time', 'Birth Place', 'Gender', 'Role',
 'Profile', 'League', 'Team', 'Moon Sign', 'Nakshatra', 'Birth Chart'
 ];
 sheet.columns = headers.map((h, i) => ({
 header: h,
 key: `col${i}`,
 width: h === 'Name' ? 25 : h === 'Birth Place' ? 35 : h === 'Moon Sign' ? 18 : h === 'Nakshatra' ? 20 : 15
 }));

 // Style header
 sheet.getRow(1).eachCell(cell => {
 cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
 cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
 cell.alignment = { horizontal: 'center', vertical: 'center' };
 });
 sheet.getRow(1).height = 25;

 // Gender mapping
 const genderMap = { male: 'Male', female: 'Female', m: 'Male', f: 'Female' };

 for (let i = 0; i < players.length; i++) {
 const p = players[i];
 const chart = p.birthChart || {};
 const planets = chart.planets || {};
 const moon = planets.Moon || {};
 const gender = p.gender ? genderMap[p.gender.toLowerCase()] || p.gender : '';

 // League and team from birthChart if available, else from name/role
 const league = p.league || p.leagueType || '';
 const team = p.team || '';

 const rowData = [
 i + 1, // S.No
 p.name || '', // Name
 p.dob || '', // DOB
 p.birthTime || '', // Birth Time
 p.birthPlace || '', // Birth Place
 gender, // Gender
 p.role || '', // Role
 p.profile || '', // Profile pic
 league, // League
 team, // Team
 moon.sign || '', // Moon Sign
 moon.nakshatra || '', // Nakshatra
 p.birthChart ? 'Yes' : 'No' // Birth Chart
 ];

 const row = sheet.addRow(rowData);

 // Alternate row colors
 if (i % 2 === 0) {
 row.eachCell(cell => {
 cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F6F9' } };
 });
 }

 // Center align S.No
 row.getCell(1).alignment = { horizontal: 'center' };
 }

 // Auto filter
 sheet.autoFilter = 'A1:M1';

 // Freeze header
 sheet.views = [{ state: 'frozen', ySplit: 1 }];

 // Save
 await workbook.xlsx.writeFile(OUTPUT_PATH);

 console.log('=== Export Complete ===');
 console.log(`File: ${OUTPUT_PATH}`);
 console.log(`Players: ${players.length}`);
 console.log(`File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);

 // Stats
 const withDOB = players.filter(p => p.dob).length;
 const withBirthTime = players.filter(p => p.birthTime).length;
 const withBirthPlace = players.filter(p => p.birthPlace).length;
 const withChart = players.filter(p => p.birthChart).length;

 console.log('\nStats:');
 console.log(` With DOB: ${withDOB}/${players.length}`);
 console.log(` With Birth Time: ${withBirthTime}/${players.length}`);
 console.log(` With Birth Place: ${withBirthPlace}/${players.length}`);
 console.log(` With Birth Chart: ${withChart}/${players.length}`);

 // League breakdown
 const leagues = {};
 players.forEach(p => {
 const l = p.league || p.leagueType || 'Unknown';
 leagues[l] = (leagues[l] || 0) + 1;
 });
 console.log('\nLeague Breakdown:');
 Object.entries(leagues).sort((a, b) => b[1] - a[1]).forEach(([l, c]) => {
 console.log(` ${l}: ${c}`);
 });

 await mongoose.disconnect();
 console.log('\nDone!');
 process.exit(0);
}

exportPlayers().catch(err => {
 console.error('Error:', err);
 process.exit(1);
});
