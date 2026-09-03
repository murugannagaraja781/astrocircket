const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://murugannagaraja781_db_user:NewLife2025@cluster0.tp2gekn.mongodb.net/circket';
const OUTPUT_PATH = path.join(__dirname, 'enhanced_players.json');
const PROGRESS_PATH = path.join(__dirname, 'enhance_progress.json');
const Player = require('./models/Player');

function httpsGet(urlStr, timeout = 15000) {
 return new Promise((resolve, reject) => {
 const lib = urlStr.startsWith('https') ? https : require('http');
 const req = lib.get(urlStr, {
 headers: {
 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
 'Accept': 'text/html,application/xhtml+xml',
 'Accept-Encoding': 'identity',
 'Connection': 'close'
 },
 timeout
 }, (res) => {
 if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
 const { URL } = require('url');
 const redirectUrl = URL.resolve(urlStr, res.headers.location);
 httpsGet(redirectUrl, timeout).then(resolve).catch(reject);
 return;
 }
 let data = '';
 res.setEncoding('utf-8');
 res.on('data', chunk => data += chunk);
 res.on('end', () => resolve({ status: res.statusCode, data }));
 }).on('error', reject);
 });
}

function sleep(ms = 400) {
 return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch from Wikipedia parse API (HTML)
async function fetchBirthDetails(name) {
 try {
 const encoded = encodeURIComponent(name.replace(/ /g, '_'));
 const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encoded}&prop=text&format=json&utf8=1`;
 const response = await httpsGet(url, 12000);

 if (response.status !== 200) return null;

 const json = JSON.parse(response.data);
 if (!json.parse || !json.parse.text) return null;

 const html = json.parse.text['*'];
 const result = { name, birthDate: '', birthPlace: '', gender: '' };

 // Birth date - class="bday"
 const bdayMatch = html.match(/class="bday">(\d{4}-\d{2}-\d{2})/);
 if (bdayMatch) result.birthDate = bdayMatch[1];

 // Birth place - class="birthplace" - extract text content
 const bpMatch = html.match(/class="birthplace">([\s\S]*?)<\/span>/);
 if (bpMatch) {
 let place = bpMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
 result.birthPlace = place;
 }

 // If no birthplace class, try table extraction
 if (!result.birthPlace) {
 const bpMatch2 = html.match(/出生地|birth_place|Born[^<]*<td[^>]*>([\s\S]*?)<\/td>/i);
 if (bpMatch2) {
 result.birthPlace = bpMatch2[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().substring(0, 100);
 }
 }

 // Gender from description or content
 if (/women'?s?\s+cricket|female\s+cricketer|woman\s+cricketer/i.test(html)) {
 result.gender = 'Female';
 } else if (/cricketer|cricket/i.test(html)) {
 result.gender = 'Male';
 }

 return result;
 } catch {
 return null;
 }
}

async function main() {
 console.log('=== Enhancing Player Data with Birth Details ===\n');
 await mongoose.connect(MONGO_URI);
 console.log('Connected to MongoDB');

 const players = await Player.find({}).lean();
 console.log(`Found ${players.length} players\n`);

 let results = [];
 if (fs.existsSync(PROGRESS_PATH)) {
 try {
 results = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
 console.log(`Resuming from ${results.length}\n`);
 } catch (e) {}
 }

 const resultMap = new Map(results.map(r => [r._id?.toString() || r.name, r]));
 let stats = { processed: 0, withDOB: 0, withPlace: 0, male: 0, female: 0 };

 for (const player of players) {
 const key = player._id?.toString() || player.name;
 if (resultMap.has(key)) continue;
 stats.processed++;

 console.log(`[${stats.processed}/${players.length}] ${player.name}...`);

 const details = await fetchBirthDetails(player.name);

 if (details) {
 if (details.birthDate) { stats.withDOB++; }
 if (details.birthPlace) { stats.withPlace++; }
 if (details.gender === 'Male') stats.male++;
 if (details.gender === 'Female') stats.female++;

 console.log(details.birthDate ? ` DOB: ${details.birthDate}` : '', details.birthPlace ? `| Place: ${details.birthPlace}` : '');
 }

 resultMap.set(key, {
 ...player,
 birthDate: details?.birthDate || '',
 birthPlace: details?.birthPlace || player.birthPlace || '',
 gender: details?.gender || player.gender || ''
 });

 // Save progress every 30
 if (stats.processed % 30 === 0) {
 results = Array.from(resultMap.values());
 fs.writeFileSync(PROGRESS_PATH, JSON.stringify(results, null, 2));
 console.log(` [Progress: ${stats.processed}/${players.length} | DOB: ${stats.withDOB} | Place: ${stats.withPlace}]\n`);
 }

 await sleep(300);
 }

 results = Array.from(resultMap.values());
 fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
 fs.writeFileSync(PROGRESS_PATH, JSON.stringify(results, null, 2));

 const withDOB = results.filter(p => p.birthDate).length;
 const withPlace = results.filter(p => p.birthPlace).length;
 const male = results.filter(p => p.gender === 'Male').length;
 const female = results.filter(p => p.gender === 'Female').length;

 console.log('\n=== Collection Complete ===');
 console.log(`Total: ${results.length}`);
 console.log(`With DOB: ${withDOB} (${Math.round(withDOB/results.length*100)}%)`);
 console.log(`With birth place: ${withPlace} (${Math.round(withPlace/results.length*100)}%)`);
 console.log(`Male: ${male} | Female: ${female}`);
 console.log(`\nSaved: ${OUTPUT_PATH}`);
 console.log(`Size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);

 // Sample
 console.log('\nSample with DOB:');
 results.filter(p => p.birthDate).slice(0,20).forEach(p => {
 console.log(` ${p.name} | ${p.birthDate} | ${p.birthPlace||'N/A'} | ${p.gender||'N/A'}`);
 });

 await mongoose.disconnect();
 process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
