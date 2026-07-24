const fs = require('fs');

// Sign Lords Mapping
const signLords = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
    "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
    "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
};

// Own Signs Mapping
const OWN_SIGNS = {
    'Sun': ['Leo'], 'Moon': ['Cancer'], 'Mars': ['Aries', 'Scorpio'],
    'Mercury': ['Gemini', 'Virgo'], 'Jupiter': ['Sagittarius', 'Pisces'],
    'Venus': ['Taurus', 'Libra'], 'Saturn': ['Capricorn', 'Aquarius']
};

const EXALTED_SIGNS = {
    'Sun': 'Aries', 'Moon': 'Taurus', 'Mars': 'Capricorn',
    'Mercury': 'Virgo', 'Jupiter': 'Cancer', 'Venus': 'Pisces',
    'Saturn': 'Libra'
};

const isStrong = (planet, sign) => {
    if (EXALTED_SIGNS[planet] === sign) return true;
    if (OWN_SIGNS[planet]?.includes(sign)) return true;
    return false;
};

const player = JSON.parse(fs.readFileSync('c:\\Users\\abina\\astro_cricket\\astrocircket\\server\\mitchell_owen.json', 'utf8'));
const P = player.birthChart.planets;

// Match mock values
const matchRasi = "Leo";
const matchStar = "Magha";
const matchLagna = "Leo";

let score = 0;
const report = [];

const addRule = (name, pts, tamil) => {
    score += pts;
    report.push(`${name} (+${pts}) [${tamil}]`);
};

// Match Lords
const matchRL = "Sun"; // Leo Lord
let matchSL = "Ketu"; // Magha Lord
// Rahu/Ketu override for Magam
if (matchStar === "Magha") matchSL = "Mars";

// Player details (Moon based)
const pRL = P.Moon.signLord;
const pSL = P.Moon.nakshatraLord;

console.log(`Player: ${player.name}`);
console.log(`Player Rasi Lord: ${pRL}, Player Star Lord: ${pSL}`);
console.log(`Match Rasi Lord: ${matchRL}, Match Star Lord: ${matchSL} (Magam Override)`);

// Rule 1: Zig-Zag
if (matchRL === pSL && matchSL === pRL) {
    addRule("Rule 1: Zig-Zag", 12, "ஜிக்-ஜாக்");
}

// Rule 2: Direct
if (matchRL === pRL && matchSL === pSL) {
    addRule("Rule 2: Direct", 6, "நேரடி விதி");
}

// Rule 3: Star
if (matchSL === pRL || matchSL === pSL) {
    addRule("Rule 3: Star", 4, "நட்சத்திர விதி");
}

// Rule 4: Conjunction
// In player's chart, is matchSL conjoined with pRL?
if (P[matchSL].sign === P[pRL].sign) {
    addRule("Rule 4: Conjunction", 4, "சேர்க்கை விதி");
}

// Rule 6: Player Home
// Match RL and SL both in Player's Rasi sign (in Match chart - assuming simulated match in Leo)
// For mock, we'll assume +6 if matchRL and matchSL are both considered active in match sign
addRule("Rule 6: Player Home", 6, "ராசி அதிபதி வீடு");

// Rule 8: Lagna
if (matchRL === pRL) { // matchLagnaLord is Sun
    addRule("Rule 8: Lagna", 2, "லக்ன விதி");
    if (isStrong(pRL, P[pRL].sign)) addRule("Rule 8: Bonus", 2, "போனஸ்");
}

// Rule 9: Double Lord Conjunction
if (P[matchRL].sign === P[matchSL].sign) {
    addRule("Rule 9: Double Lord Conjunction", 12, "இரட்டை அதிபதி சேர்க்கை");
}

console.log("\nTotal Score:", score);
console.log("Report:");
report.forEach(r => console.log(r));
