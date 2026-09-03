// Parse the PDF extracted text into structured JSON
const fs = require('fs');
const path = require('path');

const RAW_PATH = path.join(__dirname, 'pdf_raw.txt');
const OUTPUT_PATH = path.join(__dirname, 'parsed_players.json');

const raw = fs.readFileSync(RAW_PATH, 'utf-8');

const lines = raw.split('\n');
const players = [];
let currentLeague = '';

// League header patterns
const LEAGUE_MAP = {
 'BBL 2025-26': 'BBL',
 'BPL 2025-26': 'BPL',
 'CPL 2026': 'CPL',
 'IPL 2026': 'IPL',
 'MLC 2026': 'MLC',
 'PSL 2026': 'PSL',
 'SA20 2025-26': 'SA20',
 'The Hundred 2026': 'The Hundred'
};

for (let i = 0; i < lines.length; i++) {
 const line = lines[i].trim();

 // Detect league headers
 for (const [pattern, league] of Object.entries(LEAGUE_MAP)) {
 if (line === pattern || line.includes(pattern)) {
 currentLeague = league;
 break;
 }
 }

 // Skip headers and empty lines
 if (!line || line.includes('Roster name') || line.includes('Matched player') ||
 line.includes('DOB') && line.includes('Birth place') && line.includes('Country') ||
 line.includes('Status') && line.includes('DOB') || line.includes('Total league-player') ||
 line.includes('Complete DOB') || line.includes('Partial/not matched') ||
 line.includes('Data notes') || line.includes('NDTV') || line.includes('Cricbuzz') ||
 line.includes('source') || line.includes('retrieved') || line.includes('blank field') ||
 line.includes('not guessed') || line.includes('uses the') || line.includes('squad sources')) {
 continue;
 }

 // Player row format: Name | MatchedName | DOB | BirthPlace | Country | Status
 // Some rows have multiline birth places, so we need to handle that
 if (line && currentLeague && !Object.keys(LEAGUE_MAP).some(k => line === k || line.includes(k))) {
 // This should be a player row
 const parts = line.split('|').map(s => s.trim());

 if (parts.length >= 4) {
 const rosterName = parts[0] || '';
 const matchedName = parts[1] || rosterName;
 const dob = parts[2] || '';
 const birthPlace = parts[3] || '';
 const country = parts[4] || '';
 const status = parts[5] || '';

 if (rosterName && rosterName.length > 2) {
 players.push({
 league: currentLeague,
 rosterName,
 matchedName,
 dob: dob === 'Not found' ? '' : dob,
 birthPlace: birthPlace === 'Not found' ? '' : birthPlace,
 country: country === 'Not found' ? '' : country,
 status: status === 'Not found' ? '' : status
 });
 }
 }
 }
}

// Deduplicate by rosterName + league
const seen = new Map();
for (const p of players) {
 const key = `${p.league}|${p.rosterName.toLowerCase()}`;
 if (!seen.has(key)) {
 seen.set(key, p);
 }
}

const unique = Array.from(seen.values());

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(unique, null, 2));

console.log('=== PDF Parse Complete ===');
console.log(`Total rows: ${players.length}`);
console.log(`Unique players: ${unique.length}`);
console.log(`\nLeague breakdown:`);
const leagueStats = {};
unique.forEach(p => { leagueStats[p.league] = (leagueStats[p.league] || 0) + 1; });
Object.entries(leagueStats).sort((a,b) => b[1] - a[1]).forEach(([l,c]) => console.log(` ${l}: ${c}`));

console.log(`\nWith DOB: ${unique.filter(p => p.dob).length}`);
console.log(`With Birth Place: ${unique.filter(p => p.birthPlace).length}`);
console.log(`\nSaved to: ${OUTPUT_PATH}`);
