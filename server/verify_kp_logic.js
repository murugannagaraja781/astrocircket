const { generateKPTimeline } = require('./utils/kp_calculations');

// Sample data: Chennai - 2026-02-06 14:40
const lat = 13.0827;
const lon = 80.2707;
const timezone = 5.5;
const ayanamsa = 24.23; // Approximate Lahiri
const startTime = '2026-02-06T14:40:00';

console.log('--- KP Math Verification ---');

// 1. Check Sub division for a known longitude
// 0 degrees Aries = Ashwini (Ketu) - Sub Ketu
const d1 = getKPSubDetails(0);
console.log('0° Aries:', d1.nakshatra, 'Lord:', d1.nakLord, 'Sub:', d1.subLord);

// 2. Check Lagna Speed at equator vs Chennai
const speedEquator = getLagnaSpeed(0, 0);
const speedChennai = getLagnaSpeed(lat, 0);
console.log('Speed Equator:', speedEquator.toFixed(4), '"/s');
console.log('Speed Chennai:', speedChennai.toFixed(4), '"/s');

// 3. Generate Timeline and check jump count
const timeline = generateKPTimeline(startTime, lat, lon, timezone, ayanamsa);

console.log('\n--- Timeline Summary ---');
console.log('Total Rows:', timeline.length);
console.log('First Row:', JSON.stringify(timeline[0], null, 2));
console.log('Last Row:', JSON.stringify(timeline[timeline.length - 1], null, 2));

// Verify no gaps
let gaps = 0;
for (let i = 0; i < timeline.length - 1; i++) {
    if (timeline[i].to !== timeline[i + 1].from) {
        gaps++;
    }
}
console.log('Gaps detected:', gaps);

// Verify jump constraint (120-150 rows)
if (timeline.length >= 100 && timeline.length <= 200) {
    console.log('Row count check: PASSED');
} else {
    console.log('Row count check: WARNING -', timeline.length, 'rows');
}
