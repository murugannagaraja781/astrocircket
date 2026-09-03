const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const INPUT_PATH = path.join(__dirname, 'all_players_draft.json');
const OUTPUT_PATH = path.join(__dirname, 'all_players_with_dob.json');
const PROGRESS_PATH = path.join(__dirname, 'dob_progress.json');

function makeRequest(urlStr) {
 return new Promise((resolve, reject) => {
 const lib = urlStr.startsWith('https') ? https : http;

 const req = lib.request(urlStr, {
 method: 'GET',
 headers: {
 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
 'Accept-Language': 'en-US,en;q=0.5',
 'Accept-Encoding': 'identity',
 'Connection': 'close'
 },
 timeout: 15000
 }, (res) => {
 // Handle redirects
 if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
 const redirectUrl = new URL(res.headers.location, urlStr).toString();
 makeRequest(redirectUrl).then(resolve).catch(reject);
 return;
 }

 let data = '';
 res.setEncoding('utf-8');
 res.on('data', chunk => data += chunk);
 res.on('end', () => resolve({ status: res.statusCode, data }));
 }).on('error', reject);
 });
}

function sleep(ms = 1000) {
 return new Promise(resolve => setTimeout(resolve, ms));
}

// Search Wikipedia for player page
async function searchWikipediaPlayer(name) {
 try {
 const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(name)}&limit=5&namespace=0&format=json&utf8=1`;
 const response = await makeRequest(url);
 if (response.status !== 200) return null;

 const results = JSON.parse(response.data);
 const titles = results[1] || [];
 const descriptions = results[2] || [];

 // Find cricketer match
 for (let i = 0; i < titles.length; i++) {
 const desc = (descriptions[i] || '').toLowerCase();
 if (desc.includes('cricketer')) return titles[i];
 }

 // First result if no colon in title
 if (titles.length > 0 && !titles[0].includes(':')) return titles[0];
 return null;
 } catch {
 return null;
 }
}

// Fetch wikitext content
async function fetchWikitext(title) {
 try {
 const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&utf8=1`;
 const response = await makeRequest(url);
 if (response.status !== 200) return null;
 const json = JSON.parse(response.data);
 return json.parse?.wikitext?.['*'] || null;
 } catch {
 return null;
 }
}

// Fetch REST summary
async function fetchSummary(title) {
 try {
 const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
 const response = await makeRequest(url);
 if (response.status !== 200) return null;
 return JSON.parse(response.data);
 } catch {
 return null;
 }
}

// Fetch Wikidata ID
async function fetchWikidataId(title) {
 try {
 const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(title)}&ppprop=wikibase_item&format=json&utf8=1`;
 const response = await makeRequest(url);
 if (response.status !== 200) return null;
 const json = JSON.parse(response.data);
 const pages = json.query?.pages;
 if (!pages) return null;
 return Object.values(pages)[0]?.pageprops?.wikibase_item || null;
 } catch {
 return null;
 }
}

// Fetch Wikidata birth data
const wdCache = {};
async function fetchWikidataBirth(entityId) {
 if (wdCache[entityId]) return wdCache[entityId];
 try {
 const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims&languages=en&format=json&utf8=1`;
 const response = await makeRequest(url);
 if (response.status !== 200) { wdCache[entityId] = null; return null; }
 const json = JSON.parse(response.data);
 const entity = json.entities?.[entityId];
 if (!entity?.claims) { wdCache[entityId] = null; return null; }

 const result = { birthDate: '', birthPlace: '', gender: '' };
 const claims = entity.claims;

 // Birth date
 if (claims.P569?.[0]?.mainsnak?.datavalue?.value?.time) {
 result.birthDate = claims.P569[0].mainsnak.datavalue.value.time.substring(1, 11);
 }

 // Birth place
 if (claims.P19?.[0]?.mainsnak?.datavalue?.value?.id) {
 result.birthPlace = await fetchWdLabel(claims.P19[0].mainsnak.datavalue.value.id);
 }

 // Gender
 if (claims.P21?.[0]?.mainsnak?.datavalue?.value?.id) {
 const g = claims.P21[0].mainsnak.datavalue.value.id;
 if (g === 'Q6581097') result.gender = 'Male';
 else if (g === 'Q6581072') result.gender = 'Female';
 }

 // Country fallback
 if (!result.birthPlace && claims.P27?.[0]?.mainsnak?.datavalue?.value?.id) {
 result.birthPlace = await fetchWdLabel(claims.P27[0].mainsnak.datavalue.value.id);
 }

 wdCache[entityId] = result.birthDate ? result : null;
 return wdCache[entityId];
 } catch {
 wdCache[entityId] = null;
 return null;
 }
}

async function fetchWdLabel(id) {
 if (wdCache[`label_${id}`]) return wdCache[`label_${id}`];
 try {
 const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&props=labels&languages=en&format=json&utf8=1`;
 const response = await makeRequest(url);
 if (response.status !== 200) { wdCache[`label_${id}`] = id; return id; }
 const json = JSON.parse(response.data);
 const label = json.entities?.[id]?.labels?.en?.value || id;
 wdCache[`label_${id}`] = label;
 return label;
 } catch {
 wdCache[`label_${id}`] = id;
 return id;
 }
}

const MONTHS = { january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12' };

// Extract birth details from wikitext
function extractFromWikitext(wikitext, title) {
 const r = { name: title, birthDate: '', birthPlace: '', gender: '' };

 let m = wikitext.match(/\|\s*birth_date\s*=\s*\{\{[^}]*?birth\s+date[^}]*?\|(\d{4})\|(\d{1,2})\|(\d{1,2})/);
 if (!m) m = wikitext.match(/\|\s*birth_date\s*=\s*\{\{Birth\s+date[^}]*?\|(\d{4})\|(\d{1,2})\|(\d{1,2})/);
 if (!m) m = wikitext.match(/\|\s*birth_date\s*=\s*\{\{birth\s+date\|(\d{4})\|(\d{1,2})\|(\d{1,2})/);
 if (!m) m = wikitext.match(/\|\s*birth_date\s*=\s*(\d{1,2}\s+\w+\s+\d{4})/);
 if (!m) m = wikitext.match(/\|\s*birth_date\s*=\s*(\d{4}-\d{2}-\d{2})/);

 if (m) {
 if (m[1].includes('-') && m[1].length === 10) r.birthDate = m[1];
 else if (m.length >= 4) r.birthDate = `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
 else if (m[1].length === 4) {
 const parts = m[0].match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
 if (parts && MONTHS[parts[2].toLowerCase()]) r.birthDate = `${parts[3]}-${MONTHS[parts[2].toLowerCase()]}-${String(parts[1]).padStart(2,'0')}`;
 }
 }

 m = wikitext.match(/\|\s*birth_place\s*=\s*([^\n]+)/);
 if (m) r.birthPlace = m[1].replace(/\{\{.*?\}\}/g,'').replace(/\[\[(.*?)\|.*?\]\]/g,'$1').replace(/\[\[(.*?)\]\]/g,'$1').replace(/<ref.*?\/>/g,'').trim();

 if (wikitext.match(/\|\s*gender\s*=\s*[Ff]emale/)) r.gender = 'Female';
 else if (wikitext.match(/\|\s*gender\s*=\s*[Mm]ale/)) r.gender = 'Male';
 else if (wikitext.match(/women'?s?\s+cricket|female\s+cricketer/i)) r.gender = 'Female';

 return r.birthDate ? r : null;
}

// Extract from REST summary
function extractFromSummary(summary, title) {
 const r = { name: title, birthDate: '', birthPlace: '', gender: '' };
 if (summary.birth_date) {
 const iso = summary.birth_date.match(/(\d{4})-(\d{2})-(\d{2})/);
 if (iso) r.birthDate = `${iso[1]}-${iso[2]}-${iso[3]}`;
 }
 if (summary.birthplace) r.birthPlace = summary.birthplace.replace(/\[\d+\]/g,'').trim();
 if (summary.description) {
 const d = summary.description.toLowerCase();
 if (d.includes('woman')||d.includes('female')) r.gender = 'Female';
 else if (d.includes('cricketer')||d.includes('cricket')) r.gender = 'Male';
 }
 return r.birthDate ? r : null;
}

// Fetch all birth details for one player
async function fetchPlayerBirthDetails(name) {
 // 1. Search for Wikipedia page
 const title = await searchWikipediaPlayer(name);
 if (!title) return null;

 // 2. Try REST summary API
 const summary = await fetchSummary(title);
 if (summary) {
 const result = extractFromSummary(summary, title);
 if (result) return result;
 }

 // 3. Try wikitext
 const wikitext = await fetchWikitext(title);
 if (wikitext) {
 const result = extractFromWikitext(wikitext, title);
 if (result) return result;
 }

 // 4. Try Wikidata
 const wdId = await fetchWikidataId(title);
 if (wdId) {
 const wdResult = await fetchWikidataBirth(wdId);
 if (wdResult) { wdResult.name = name; return wdResult; }
 }

 return null;
}

// MAIN
async function main() {
 console.log('=== Cricket Player Birth Details Collector ===\n');

 const players = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
 const validPlayers = players.filter(p => p.name && p.name.trim().length > 2);
 console.log(`Total players: ${validPlayers.length}`);

 let results = [];
 if (fs.existsSync(PROGRESS_PATH)) {
 try {
 results = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
 console.log(`Resuming from ${results.length}\n`);
 } catch (e) {}
 }

 const resultMap = new Map(results.map(r => [r.name, r]));
 let stats = { processed: 0, withDOB: 0, withPlace: 0, male: 0, female: 0 };

 for (let i = 0; i < validPlayers.length; i++) {
 const player = validPlayers[i];
 if (resultMap.has(player.name)) continue;
 stats.processed++;

 const details = await fetchPlayerBirthDetails(player.name);

 if (details && details.birthDate) {
 resultMap.set(player.name, {
 ...player,
 birthDate: details.birthDate,
 birthPlace: details.birthPlace || player.birthPlace || '',
 gender: details.gender || player.gender || ''
 });
 stats.withDOB++;
 if (details.gender === 'Male') stats.male++;
 if (details.gender === 'Female') stats.female++;
 if (details.birthPlace) stats.withPlace++;
 } else {
 resultMap.set(player.name, { ...player, birthDate: '', birthPlace: player.birthPlace || '', gender: player.gender || '' });
 }

 if (stats.processed % 20 === 0) {
 results = Array.from(resultMap.values());
 fs.writeFileSync(PROGRESS_PATH, JSON.stringify(results, null, 2));
 console.log(`[${stats.processed}/${validPlayers.length}] DOB:${stats.withDOB} Place:${stats.withPlace} M:${stats.male} F:${stats.female}`);
 }

 await sleep(600);
 }

 // Final save and dedup
 results = Array.from(resultMap.values());
 fs.writeFileSync(PROGRESS_PATH, JSON.stringify(results, null, 2));

 const deduped = new Map();
 for (const p of results) {
 const existing = deduped.get(p.name);
 if (!existing) { deduped.set(p.name, p); continue; }
 const eScore = (existing.birthDate?1:0)+(existing.birthPlace?1:0)+(existing.gender?1:0);
 const nScore = (p.birthDate?1:0)+(p.birthPlace?1:0)+(p.gender?1:0);
 if (nScore > eScore) {
 const combined = [...new Set([...existing.leagues, ...p.leagues])];
 deduped.set(p.name, { ...p, leagues: combined });
 }
 }

 const uniquePlayers = Array.from(deduped.values());
 fs.writeFileSync(OUTPUT_PATH, JSON.stringify(uniquePlayers, null, 2));

 const withDOB = uniquePlayers.filter(p => p.birthDate).length;
 const withPlace = uniquePlayers.filter(p => p.birthPlace).length;
 const male = uniquePlayers.filter(p => p.gender === 'Male').length;
 const female = uniquePlayers.filter(p => p.gender === 'Female').length;

 console.log('\n=== Collection Complete ===');
 console.log(`Total unique: ${uniquePlayers.length}`);
 console.log(`With DOB: ${withDOB} (${Math.round(withDOB/uniquePlayers.length*100)}%)`);
 console.log(`With place: ${withPlace} (${Math.round(withPlace/uniquePlayers.length*100)}%)`);
 console.log(`Male: ${male} | Female: ${female}`);
 console.log(`\nSaved: ${OUTPUT_PATH}`);
 console.log(`Size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);

 console.log('\nLeague breakdown:');
 const leagueStats = {};
 uniquePlayers.forEach(p => p.leagues.forEach(l => { leagueStats[l.league] = (leagueStats[l.league]||0)+1; }));
 Object.entries(leagueStats).sort((a,b)=>b[1]-a[1]).forEach(([l,c]) => console.log(` ${l}: ${c}`));

 console.log('\nSample:');
 uniquePlayers.filter(p => p.birthDate).slice(0,15).forEach(p => console.log(` ${p.name} | ${p.birthDate} | ${p.birthPlace||'N/A'} | ${p.gender||'N/A'}`));
}

main().catch(err => { console.error(err); process.exit(1); });
