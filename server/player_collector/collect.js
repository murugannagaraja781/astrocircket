const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, 'all_players_draft.json');
const PROGRESS_PATH = path.join(__dirname, 'progress_draft.json');

// Teams mapping
const ALL_LEAGUES = {
 'IPL': {
 'Chennai Super Kings': 'Chennai Super Kings',
 'Mumbai Indians': 'Mumbai Indians',
 'Royal Challengers Bangalore': 'Royal Challengers Bangalore',
 'Kolkata Knight Riders': 'Kolkata Knight Riders',
 'Delhi Capitals': 'Delhi Capitals',
 'Punjab Kings': 'Punjab Kings',
 'Rajasthan Royals': 'Rajasthan Royals',
 'Sunrisers Hyderabad': 'Sunrisers Hyderabad',
 'Gujarat Titans': 'Gujarat Titans',
 'Lucknow Super Giants': 'Lucknow Super Giants'
 },
 'BBL': {
 'Adelaide Strikers': 'Adelaide Strikers',
 'Brisbane Heat': 'Brisbane Heat',
 'Hobart Hurricanes': 'Hobart Hurricanes',
 'Melbourne Renegades': 'Melbourne Renegades',
 'Melbourne Stars': 'Melbourne Stars',
 'Perth Scorchers': 'Perth Scorchers',
 'Sydney Sixers': 'Sydney Sixers',
 'Sydney Thunder': 'Sydney Thunder'
 },
 'CPL': {
 'Barbados Royals': 'Barbados Royals',
 'Guyana Amazon Warriors': 'Guyana Amazon Warriors',
 'Jamaica Tallawahs': 'Jamaica Tallawahs',
 'St Kitts & Nevis Patriots': 'St Kitts & Nevis Patriots',
 'St Lucia Kings': 'St Lucia Kings',
 'Trinbago Knight Riders': 'Trinbago Knight Riders'
 },
 'PSL': {
 'Islamabad United': 'Islamabad United',
 'Karachi Kings': 'Karachi Kings',
 'Lahore Qalandars': 'Lahore Qalandars',
 'Multan Sultans': 'Multan Sultans',
 'Peshawar Zalmi': 'Peshawar Zalmi',
 'Quetta Gladiators': 'Quetta Gladiators'
 },
 'The Hundred': {
 'Birmingham Phoenix': 'Birmingham Phoenix',
 'London Spirit': 'London Spirit',
 'Manchester Originals': 'Manchester Originals',
 'Northern Superchargers': 'Northern Superchargers',
 'Oval Invincibles': 'Oval Invincibles',
 'Southern Brave': 'Southern Brave',
 'Trent Rockets': 'Trent Rockets',
 'Welsh Fire': 'Welsh Fire'
 },
 'MLC': {
 'Seattle Orcas': 'Seattle Orcas',
 'MI New York': 'MI New York',
 'San Francisco Unicorns': 'San Francisco Unicorns',
 'Texas Super Kings': 'Texas Super Kings',
 'Washington Freedom': 'Washington Freedom',
 'Los Angeles Knight Riders': 'Los Angeles Knight Riders'
 },
 'SA20': {
 'Durban Super Giants': 'Durban Super Giants',
 'MI Cape Town': 'MI Cape Town',
 'Paarl Royals': 'Paarl Royals',
 'Pretoria Capitals': 'Pretoria Capitals',
 'Sunrisers Eastern Cape': 'Sunrisers Eastern Cape',
 'Joburg Super Kings': 'Joburg Super Kings'
 },
 'BPL': {
 'Comilla Victorians': 'Comilla Victorians',
 'Durbar Rajshahi': 'Durbar Rajshahi',
 'Fortune Barishal': 'Fortune Barishal',
 'Chattogram Challengers': 'Chattogram Challengers',
 'Khulna Tigers': 'Khulna Tigers',
 'Rangpur Riders': 'Rangpur Riders',
 'Sylhet Strikers': 'Sylhet Strikers'
 }
};

function httpsGet(url) {
 return new Promise((resolve, reject) => {
 const req = https.get(url, {
 headers: {
 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
 'Accept': 'application/json, text/plain, */*',
 'Accept-Language': 'en-US,en;q=0.9'
 },
 timeout: 15000
 }, (res) => {
 let data = '';
 res.on('data', chunk => data += chunk);
 res.on('end', () => resolve({ status: res.statusCode, data }));
 }).on('error', (err) => reject(err));
 });
}

function sleep(ms) {
 return new Promise(resolve => setTimeout(resolve, ms));
}

// Extract player names from team Wikipedia page
async function fetchTeamPlayers(teamName) {
 // Try multiple URL formats for cricket team pages
 const urls = [
 `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(teamName + ' (cricket)')}&prop=wikitext&format=json`,
 `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(teamName.replace(/ /g, '_'))}&prop=wikitext&format=json`,
 `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(teamName + ' cricket team')}&prop=wikitext&format=json`
 ];

 let rawHtml = null;

 for (const url of urls) {
 try {
 const response = await httpsGet(url);
 if (response.status === 200 && response.data.length > 100) {
 const json = JSON.parse(response.data);
 if (json.parse && json.parse.wikitext) {
 rawHtml = json.parse.wikitext['*'];
 break;
 }
 }
 } catch (e) {
 continue;
 }
 await sleep(200);
 }

 if (!rawHtml) {
 // Fallback to REST API summary page
 try {
 const restUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(teamName.replace(/ /g, '_'))}`;
 const response = await httpsGet(restUrl);
 if (response.status === 200) {
 const json = JSON.parse(response.data);
 return { players: [], html: json.extract || '' };
 }
 } catch (e) {}
 return { players: [] };
 }

 // Extract player names from wikitext
 // Look for cricketer links: [[Player Name]]
 const playerRegex = /\[\[([A-Z][a-z]+(?: [A-Z][a-z]+)+)(?:\|([^]]+))?\]\]/g;
 const names = new Set();
 let match;

 while ((match = playerRegex.exec(rawHtml)) !== null) {
 let name = match[1];
 const display = match[2] || name;

 // Filter out non-player links
 if (isCricketPlayer(name)) {
 names.add(name);
 }
 }

 return { players: [...names], html: rawHtml };
}

function isCricketPlayer(name) {
 const words = name.split(' ');
 if (words.length < 2) return false;

 // Common non-player pages to exclude
 const excludeTerms = [
 'Indian Premier League', 'International cricket', 'Test cricket', 'One Day International',
 'Twenty20', 'T20 cricket', 'Cricket World Cup', 'ICC Champions Trophy',
 'Chennai', 'Mumbai', 'Kolkata', 'Delhi', 'Punjab', 'Rajasthan', 'Gujarat',
 'Bangalore', 'Hyderabad', 'Lucknow', 'Brisbane', 'Melbourne', 'Perth', 'Sydney',
 'Adelaide', 'Hobart', 'Barbados', 'Guyana', 'Jamaica', 'St Lucia', 'St Kitts',
 'Islamabad', 'Karachi', 'Lahore', 'Peshawar', 'Quetta', 'Multan',
 'Birmingham', 'London', 'Manchester', 'Trent', 'Welsh', 'Oval',
 'Seattle', 'Francisco', 'Durban', 'Paarl', 'Pretoria', 'Cape Town',
 'Comilla', 'Rajshahi', 'Barishal', 'Chattogram', 'Khulna', 'Rangpur', 'Sylhet',
 'Captain', 'cricket', 'League', 'season', 'Records', 'History',
 'List of', 'Category:', 'File:', 'Template:', 'WP:', 'Portal:',
 'Indian Premier League', 'IPL', 'BBL', 'CPL', 'PSL', 'SA20', 'BPL',
 'Super', 'Kings', 'Royals', 'Heat', 'Strikers', 'Scorchers', 'Sixers',
 'Thunder', 'Hurricanes', 'Stars', 'Renegades', 'Warriors', 'Tallawahs',
 'Gladiators', 'Sultans', 'Qalandars', 'Patriots', 'Zalmi', 'Knight',
 'Originals', 'Chargers', 'Capitals', 'Indians', 'Giants', 'Titans',
 'Challengers', 'Strikers', 'Riders', 'Tigers', 'Orcas', 'Unicorns',
 'Freedom', 'Rockets', 'Superchargers', 'Invincibles', 'Brave', 'Phoenix',
 'Spirit', 'Fire', 'Tallawahs', 'Amazon', 'Riders', 'Kings', 'Royals',
 'Cricket', 'Cricketer', 'Batting', 'Bowling', 'Fielding', 'Wicket',
 'Stump', 'Boundary', 'Over', 'Innings', 'Test match', 'ODI', 'Twenty20',
 'Wicket-keeper', 'All-rounder', 'Batsman', 'Bowler', 'Australia', 'England',
 'South Africa', 'New Zealand', 'Pakistan', 'Sri Lanka', 'West Indies',
 'Bangladesh', 'Afghanistan', 'Ireland', 'Scotland', 'Netherlands', 'Zimbabwe'
 ];

 const lowerName = name.toLowerCase();
 for (const term of excludeTerms) {
 if (lowerName.includes(term.toLowerCase())) {
 return false;
 }
 }

 // Each part must start with capital letter
 if (!words.every(w => w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase())) {
 return false;
 }

 // Avoid very long names (>4 words)
 if (words.length > 4) return false;

 // Avoid names with numbers or special chars
 if (!/^[A-Za-z\s\-]+$/.test(name)) return false;

 return true;
}

// Fetch birth details from Wikipedia REST API
async function fetchPlayerDetails(name) {
 try {
 const encoded = encodeURIComponent(name.replace(/ /g, '_'));
 const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
 const response = await httpsGet(url);

 if (response.status !== 200) return null;

 const json = JSON.parse(response.data);
 const result = { name, birthDate: '', birthPlace: '', gender: '' };

 // Extract birth date from birth_date field or description
 if (json.birth_date) {
 // Can be: "1981-07-07T00:00:00.000Z" or "(1981-07-07)" or "7 July 1981"
 const isoMatch = json.birth_date.match(/\d{4}-\d{2}-\d{2}/);
 if (isoMatch) {
 result.birthDate = isoMatch[0];
 } else {
 // Try other formats like "7 July 1981"
 const parts = json.birth_date.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
 if (parts) {
 const months = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
 july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };
 const month = months[parts[2].toLowerCase()];
 if (month) {
 const day = parts[1].padStart(2, '0');
 result.birthDate = `${parts[3]}-${month}-${day}`;
 }
 }
 }
 }

 // Extract birthplace
 if (json.birthplace) {
 result.birthPlace = cleanBirthPlace(json.birthplace);
 }

 // Try to determine gender from description
 if (json.description) {
 const desc = json.description.toLowerCase();
 if (desc.includes('cricketer') || desc.includes('cricket')) {
 result.gender = 'Male'; // Most cricketers are male
 }
 if (desc.includes('cricketer') && (desc.includes('woman') || desc.includes('female'))) {
 result.gender = 'Female';
 }
 }

 // If no birth date from REST API, try Wikidata
 if (!result.birthDate) {
 const wikidata = await fetchWikidataDetails(name);
 if (wikidata) {
 if (wikidata.birthDate) result.birthDate = wikidata.birthDate;
 if (wikidata.birthPlace) result.birthPlace = wikidata.birthPlace;
 if (wikidata.gender) result.gender = wikidata.gender;
 }
 }

 return result.birthDate ? result : null;
 } catch (err) {
 return null;
 }
}

function cleanBirthPlace(place) {
 // Remove reference markers like [1], [note 1], etc.
 return place.replace(/\[\d+\]/g, '').replace(/\[note \d+\]/g, '').trim();
}

// Fetch from Wikidata as fallback
async function fetchWikidataDetails(name) {
 try {
 const encoded = encodeURIComponent(name.replace(/ /g, '_'));
 const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&titles=${encoded}&sites=enwiki&props=claims&format=json`;
 const response = await httpsGet(url);

 if (response.status !== 200) return null;

 const json = JSON.parse(response.data);
 const entities = json.entities;
 const entity = entities[Object.keys(entities)[0]];

 if (!entity || !entity.claims) return null;

 const result = { name, birthDate: '', birthPlace: '', gender: '' };
 const claims = entity.claims;

 // Birth date (P569)
 if (claims.P569 && claims.P569.length > 0) {
 const time = claims.P569[0].mainsnak.datavalue?.value?.time;
 if (time) {
 result.birthDate = time.substring(1, 11);
 }
 }

 // Birth place (P19)
 if (claims.P19 && claims.P19.length > 0) {
 const placeId = claims.P19[0].mainsnak.datavalue?.value?.id;
 if (placeId) {
 result.birthPlace = await fetchPlaceLabel(placeId);
 }
 }

 // Country of citizenship (P27) - fallback for birth place
 if (!result.birthPlace && claims.P27 && claims.P27.length > 0) {
 const countryId = claims.P27[0].mainsnak.datavalue?.value?.id;
 if (countryId) {
 result.birthPlace = await fetchPlaceLabel(countryId);
 }
 }

 // Gender (P21)
 if (claims.P21 && claims.P21.length > 0) {
 const genderId = claims.P21[0].mainsnak.datavalue?.value?.id;
 if (genderId === 'Q6581097') result.gender = 'Male';
 else if (genderId === 'Q6581072') result.gender = 'Female';
 }

 return result;
 } catch (err) {
 return null;
 }
}

// Fetch place name from Wikidata
const placeCache = {};
async function fetchPlaceLabel(placeId) {
 if (placeCache[placeId]) return placeCache[placeId];

 try {
 const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${placeId}&props=labels&languages=en&format=json`;
 const response = await httpsGet(url);

 if (response.status === 200) {
 const json = JSON.parse(response.data);
 const entity = json.entities[placeId];
 if (entity && entity.labels && entity.labels.en) {
 placeCache[placeId] = entity.labels.en.value;
 return placeCache[placeId];
 }
 }
 } catch (err) {}

 placeCache[placeId] = placeId;
 return placeId;
}

// MAIN
async function main() {
 console.log('=== Cricket Player Collector ===\n');

 // Load progress
 let allPlayers = [];
 let processedSet = new Set();

 if (fs.existsSync(PROGRESS_PATH)) {
 try {
 const progress = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
 allPlayers = progress.players || [];
 processedSet = new Set(allPlayers.map(p => p.name));
 console.log(`Resuming from ${allPlayers.length} players...\n`);
 } catch (e) {}
 }

 let teamNum = 0;
 const totalTeams = Object.entries(ALL_LEAGUES).reduce((sum, [, teams]) => sum + Object.keys(teams).length, 0);

 // Step 1: Collect all unique player names from team pages
 console.log('Phase 1: Collecting player names from team pages...\n');

 const allUniqueNames = new Map(); // name -> league info

 for (const [leagueName, teams] of Object.entries(ALL_LEAGUES)) {
 console.log(`\n--- ${leagueName} ---`);

 for (const [teamName] of Object.entries(teams)) {
 teamNum++;
 console.log(`[${teamNum}/${totalTeams}] ${teamName}...`);

 const { players } = await fetchTeamPlayers(teamName);
 console.log(` Found ${players.length} players`);

 for (const name of players) {
 if (!allUniqueNames.has(name)) {
 allUniqueNames.set(name, []);
 }
 allUniqueNames.get(name).push({ league: leagueName, team: teamName });
 }

 await sleep(800); // Rate limit
 }
 }

 console.log(`\nTotal unique players found: ${allUniqueNames.size}`);

 // Step 2: Fetch birth details for each player
 console.log('\nPhase 2: Fetching birth details...\n');

 let batchCount = 0;
 const batchSize = 20;

 for (const [name, leagues] of allUniqueNames.entries()) {
 if (processedSet.has(name)) continue;

 console.log(`[${allUniqueNames.size - processedSet.size} remaining] ${name}...`);

 const details = await fetchPlayerDetails(name);

 if (details) {
 allPlayers.push({
 name: details.name,
 birthDate: details.birthDate,
 birthPlace: details.birthPlace,
 gender: details.gender,
 leagues: leagues
 });
 } else {
 allPlayers.push({
 name,
 birthDate: '',
 birthPlace: '',
 gender: '',
 leagues: leagues
 });
 }

 processedSet.add(name);
 batchCount++;

 // Save progress every batch
 if (batchCount >= batchSize) {
 fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ players: allPlayers }, null, 2));
 batchCount = 0;

 // Show stats
 const withDOB = allPlayers.filter(p => p.birthDate).length;
 const withPlace = allPlayers.filter(p => p.birthPlace).length;
 const male = allPlayers.filter(p => p.gender === 'Male').length;
 const female = allPlayers.filter(p => p.gender === 'Female').length;
 console.log(` [Progress: ${allPlayers.length} total | ${withDOB} with DOB | ${male}M/${female}F]`);
 }

 await sleep(400); // Rate limit
 }

 // Final save
 fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allPlayers, null, 2));
 fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ players: allPlayers }, null, 2));

 // Stats
 const withDOB = allPlayers.filter(p => p.birthDate).length;
 const withPlace = allPlayers.filter(p => p.birthPlace).length;
 const male = allPlayers.filter(p => p.gender === 'Male').length;
 const female = allPlayers.filter(p => p.gender === 'Female').length;
 const multiLeague = allPlayers.filter(p => p.leagues.length > 1).length;

 console.log('\n=== Collection Complete ===');
 console.log(`Total unique players: ${allPlayers.length}`);
 console.log(`With birth date: ${withDOB} (${Math.round(withDOB/allPlayers.length*100)}%)`);
 console.log(`With birth place: ${withPlace} (${Math.round(withPlace/allPlayers.length*100)}%)`);
 console.log(`Male: ${male}`);
 console.log(`Female: ${female}`);
 console.log(`Play in multiple leagues: ${multiLeague}`);
 console.log(`\nSaved to: ${OUTPUT_PATH}`);
 console.log(`File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);

 // Show sample
 console.log('\nSample players:');
 allPlayers.filter(p => p.birthDate).slice(0, 10).forEach(p => {
 console.log(` ${p.name} | ${p.birthDate} | ${p.birthPlace} | ${p.gender} | ${p.leagues.map(l=>l.league).join(', ')}`);
 });
}

main().catch(err => {
 console.error('Fatal error:', err);
 process.exit(1);
});
