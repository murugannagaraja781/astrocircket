const https = require('https');

function httpsGet(url) {
 return new Promise((resolve, reject) => {
 https.get(url, {
 headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CricketBot/1.0)' }
 }, (res) => {
 let data = '';
 res.on('data', chunk => data += chunk);
 res.on('end', () => resolve(data));
 }).on('error', reject);
 });
}

function sleep(ms) {
 return new Promise(resolve => setTimeout(resolve, ms));
}

// Test with one team
async function testTeam() {
 try {
 // Try Chennai Super Kings Wikipedia page
 const teamName = 'Chennai Super Kings';
 const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(teamName.replace(/\s/g, '_'))}`;
 console.log(`Fetching: ${url}`);

 const html = await httpsGet(url);
 console.log(`Received ${html.length} bytes`);

 // Save to file for inspection
 require('fs').writeFileSync('test_csk.html', html);
 console.log('Saved to test_csk.html');

 // Try to extract all links
 const links = [];
 const regex = /<a[^>]+title="([^"]+)"[^>]+>/g;
 let match;
 let count = 0;

 while ((match = regex.exec(html)) !== null && count < 50) {
 const title = match[1];
 // Filter for person-like names (First Last format)
 if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(title)) {
 links.push(title);
 count++;
 }
 }

 console.log('\nFirst 50 person names found:');
 links.forEach(name => console.log(' -', name));

 } catch (err) {
 console.error('Error:', err.message);
 }
}

testTeam();
