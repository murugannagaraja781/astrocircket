const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { calculatePlanetaryPositions, calculateNakshatra } = require('./utils/astroCalculator');

const NAKSHATRA_MAP = {
    'Ashwini': { no: 1, tamil: 'அஸ்வினி', lord: 'Ketu' },
    'Bharani': { no: 2, tamil: 'பரணி', lord: 'Venus' },
    'Krittika': { no: 3, tamil: 'கார்த்திகை', lord: 'Sun' },
    'Rohini': { no: 4, tamil: 'ரோகிணி', lord: 'Moon' },
    'Mrigashirsha': { no: 5, tamil: 'மிருகசீரிஷம்', lord: 'Mars' },
    'Ardra': { no: 6, tamil: 'திருவாதிரை', lord: 'Rahu' },
    'Punarvasu': { no: 7, tamil: 'புனர்பூசம்', lord: 'Jupiter' },
    'Pushya': { no: 8, tamil: 'பூசம்', lord: 'Saturn' },
    'Ashlesha': { no: 9, tamil: 'ஆயில்யம்', lord: 'Mercury' },
    'Magha': { no: 10, tamil: 'மகம்', lord: 'Ketu' },
    'Purva Phalguni': { no: 11, tamil: 'பூரம்', lord: 'Venus' },
    'Uttara Phalguni': { no: 12, tamil: 'உத்திரம்', lord: 'Sun' },
    'Hasta': { no: 13, tamil: 'ஹஸ்தம்', lord: 'Moon' },
    'Chitra': { no: 14, tamil: 'சித்திரை', lord: 'Mars' },
    'Swati': { no: 15, tamil: 'சுவாதி', lord: 'Rahu' },
    'Vishakha': { no: 16, tamil: 'விசாகம்', lord: 'Jupiter' },
    'Anuradha': { no: 17, tamil: 'அனுஷம்', lord: 'Saturn' },
    'Jyeshtha': { no: 18, tamil: 'கேட்டை', lord: 'Mercury' },
    'Mula': { no: 19, tamil: 'மூலம்', lord: 'Ketu' },
    'Purva Ashadha': { no: 20, tamil: 'பூராடம்', lord: 'Venus' },
    'Uttara Ashadha': { no: 21, tamil: 'உத்திராடம்', lord: 'Sun' },
    'Shravana': { no: 22, tamil: 'திருவோணம்', lord: 'Moon' },
    'Dhanishta': { no: 23, tamil: 'அவிட்டம்', lord: 'Mars' },
    'Shatabhisha': { no: 24, tamil: 'சதயம்', lord: 'Rahu' },
    'Purva Bhadrapada': { no: 25, tamil: 'பூரட்டாதி', lord: 'Jupiter' },
    'Uttara Bhadrapada': { no: 26, tamil: 'உத்திரட்டாதி', lord: 'Saturn' },
    'Revati': { no: 27, tamil: 'ரேவதி', lord: 'Mercury' }
};

const CAPTAIN_BIRTH_INFO = {
    'Rajat Patidar': { y: 1993, m: 6, d: 1, h: 12, min: 0, lat: 22.7196, lng: 75.8577, nakshatra: 'Chitra', starNo: 14, tamil: 'சித்திரை' },
    'Pat Cummins': { y: 1993, m: 5, d: 8, h: 9, min: 0, lat: -33.8688, lng: 151.2093, tz: 10, nakshatra: 'Jyeshtha', starNo: 18, tamil: 'கேட்டை' },
    'Hardik Pandya': { y: 1993, m: 10, d: 11, h: 20, min: 37, lat: 21.2095, lng: 72.8317, nakshatra: 'Magha', starNo: 10, tamil: 'மகம்' },
    'Ajinkya Rahane': { y: 1988, m: 6, d: 6, h: 12, min: 0, lat: 19.5, lng: 74.5, nakshatra: 'Shatabhisha', starNo: 24, tamil: 'சதயம்' },
    'Riyan Parag': { y: 2001, m: 11, d: 10, h: 9, min: 0, lat: 26.1445, lng: 91.7362, nakshatra: 'Purva Phalguni', starNo: 11, tamil: 'பூரம்' },
    'Ruturaj Gaikwad': { y: 1997, m: 1, d: 31, h: 9, min: 0, lat: 18.5204, lng: 73.8567, nakshatra: 'Swati', starNo: 15, tamil: 'சுவாதி' },
    'Shreyas Iyer': { y: 1994, m: 12, d: 6, h: 9, min: 50, lat: 19.0760, lng: 72.8777, nakshatra: 'Uttara Ashadha', starNo: 21, tamil: 'உத்திராடம்' },
    'Shubman Gill': { y: 1999, m: 9, d: 8, h: 22, min: 0, lat: 30.1500, lng: 74.0200, nakshatra: 'Magha', starNo: 10, tamil: 'மகம்' },
    'Rishabh Pant': { y: 1997, m: 10, d: 4, h: 9, min: 0, lat: 29.9457, lng: 78.1642, nakshatra: 'Swati', starNo: 15, tamil: 'சுவாதி' },
    'Axar Patel': { y: 1994, m: 1, d: 20, h: 10, min: 0, lat: 22.5645, lng: 72.9585, nakshatra: 'Ashwini', starNo: 1, tamil: 'அஸ்வினி' }
};

const VENUES = {
    'M Chinnaswamy Stadium, Bengaluru': { lat: 12.9788, lng: 77.5996 },
    'Wankhede Stadium, Mumbai': { lat: 18.9389, lng: 72.8258 },
    'Barsapara Cricket Stadium, Guwahati': { lat: 26.1428, lng: 91.7348 },
    'MYS International Cricket Stadium, Mullanpur': { lat: 30.7850, lng: 76.7320 },
    'Ekana International Cricket Stadium, Lucknow': { lat: 26.8105, lng: 81.0146 },
    'Eden Gardens, Kolkata': { lat: 22.5646, lng: 88.3433 },
    'MA Chidambaram Stadium, Chennai': { lat: 13.0628, lng: 80.2793 },
    'Arun Jaitley Stadium, Delhi': { lat: 28.6379, lng: 77.2425 },
    'Narendra Modi Stadium, Ahmedabad': { lat: 23.0917, lng: 72.5975 },
    'Rajiv Gandhi Stadium, Hyderabad': { lat: 17.4065, lng: 78.5505 },
    'Sawai Mansingh Stadium, Jaipur': { lat: 26.8940, lng: 75.8032 },
    'SVNS Stadium, Raipur': { lat: 21.1804, lng: 81.7942 },
    'HPCA Stadium, Dharamsala': { lat: 32.1976, lng: 76.3258 }
};

const TARA_INFO = {
    1: { name: 'Janma', tamil: 'ஜென்மம்', nature: 'Average / Caution', score: 5 },
    2: { name: 'Sampat', tamil: 'சம்பத்து', nature: 'Highly Auspicious (Wealth/Success)', score: 9 },
    3: { name: 'Vipat', tamil: 'விபத்து', nature: 'Inauspicious (Obstacles/Danger)', score: 2 },
    4: { name: 'Kshema', tamil: 'சேமம்', nature: 'Auspicious (Protection/Growth)', score: 8 },
    5: { name: 'Pratyak', tamil: 'பிரத்யக்', nature: 'Inauspicious (Opposition/Conflicts)', score: 3 },
    6: { name: 'Sadhana', tamil: 'சாதனை', nature: 'Highly Auspicious (Victory/Achievement)', score: 9.5 },
    7: { name: 'Naidhana', tamil: 'வதம்/நைதனம்', nature: 'Most Inauspicious (Destruction/Loss)', score: 1 },
    8: { name: 'Mitra', tamil: 'மித்ரம்', nature: 'Auspicious (Helpful/Friendly Support)', score: 8.5 },
    0: { name: 'Parama Mitra', tamil: 'பரம மித்ரம்', nature: 'Supreme Auspicious (Great Fortune)', score: 10 }
};

function calculateTaraCount(captainStarNo, matchStarNo) {
    let diff = (matchStarNo - captainStarNo) % 27;
    if (diff < 0) diff += 27;
    const distance = diff + 1;
    const taraIndex = distance % 9;
    const tara = TARA_INFO[taraIndex];
    return {
        distance,
        taraIndex,
        taraName: tara.name,
        taraTamil: tara.tamil,
        nature: tara.nature,
        score: tara.score
    };
}

function parseDateTime(dateStr) {
    // Examples: 'Sat 28 Mar 7:30 PM', 'Sun 05 Apr 3:30 PM'
    const parts = dateStr.trim().split(/\s+/);
    // parts: ['Sat', '28', 'Mar', '7:30', 'PM']
    const day = parseInt(parts[1], 10);
    const monthStr = parts[2].toLowerCase();
    const months = { 'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12 };
    const month = months[monthStr] || 3;
    const year = 2026;

    const timeParts = parts[3].split(':');
    let hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const ampm = parts[4] ? parts[4].toUpperCase() : 'PM';
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    return { year, month, day, hour, minute };
}

async function run() {
    const inputPath = 'C:\\Users\\abina\\Downloads\\ipl_matches_with_captains.xlsx';
    const outputPath = 'C:\\Users\\abina\\Downloads\\ipl_matches_with_astrology_analysis.xlsx';

    console.log('Reading workbook from:', inputPath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(inputPath);

    const sheet = workbook.worksheets[0];
    console.log('Worksheet loaded. Total rows:', sheet.rowCount);

    // Add new column headers to row 3
    const newHeaders = [
        'Match Moon Nakshatra (நட்சத்திரம்)',
        'Match Moon Pada (பாதம்)',
        'T1 Captain Nakshatra',
        'T1 Star #',
        'T1 Distance (1-27)',
        'T1 Tara Bala (தாரை)',
        'T1 Tara Nature',
        'T2 Captain Nakshatra',
        'T2 Star #',
        'T2 Distance (1-27)',
        'T2 Tara Bala (தாரை)',
        'T2 Tara Nature',
        'Astro Tara Advantage'
    ];

    const startCol = 11; // Column K onwards
    newHeaders.forEach((h, idx) => {
        const cell = sheet.getRow(3).getCell(startCol + idx);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1F4E78' } // Dark blue header
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    const results = [];

    for (let r = 4; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const matchNo = row.getCell(1).value;
        const dateTimeStr = row.getCell(2).value;
        const venueStr = row.getCell(3).value;
        const team1 = row.getCell(4).value;
        const team1Cap = row.getCell(5).value ? row.getCell(5).value.toString().trim() : '';
        const team1Score = row.getCell(6).value;
        const team2 = row.getCell(7).value;
        const team2Cap = row.getCell(8).value ? row.getCell(8).value.toString().trim() : '';
        const team2Score = row.getCell(9).value;
        const winner = row.getCell(10).value;

        if (!matchNo || !dateTimeStr) continue;

        const dt = parseDateTime(dateTimeStr.toString());
        const venueCoords = VENUES[venueStr] || { lat: 20.5937, lng: 78.9629 };

        // Planetary Calculation for Match
        const astroRes = calculatePlanetaryPositions(dt.year, dt.month, dt.day, dt.hour, dt.minute, venueCoords.lat, venueCoords.lng, 5.5, 'Lahiri');
        const matchNak = calculateNakshatra(astroRes.planets.Moon);
        const matchStarNo = NAKSHATRA_MAP[matchNak.name] ? NAKSHATRA_MAP[matchNak.name].no : 1;

        // Captains
        const t1Info = CAPTAIN_BIRTH_INFO[team1Cap] || { nakshatra: 'Unknown', starNo: 1, tamil: '' };
        const t2Info = CAPTAIN_BIRTH_INFO[team2Cap] || { nakshatra: 'Unknown', starNo: 1, tamil: '' };

        // Distance & Tara Counts
        const t1Tara = calculateTaraCount(t1Info.starNo, matchStarNo);
        const t2Tara = calculateTaraCount(t2Info.starNo, matchStarNo);

        let advantage = 'Balanced';
        if (t1Tara.score > t2Tara.score + 1) {
            advantage = `${team1} (${t1Tara.taraName} vs ${t2Tara.taraName})`;
        } else if (t2Tara.score > t1Tara.score + 1) {
            advantage = `${team2} (${t2Tara.taraName} vs ${t1Tara.taraName})`;
        } else {
            advantage = `Competitive (${t1Tara.taraName} vs ${t2Tara.taraName})`;
        }

        // Fill Cells
        row.getCell(11).value = `${matchNak.name} (${matchNak.tamil})`;
        row.getCell(12).value = `Pada ${matchNak.pada}`;
        row.getCell(13).value = `${t1Info.nakshatra} (${t1Info.tamil})`;
        row.getCell(14).value = t1Info.starNo;
        row.getCell(15).value = t1Tara.distance;
        row.getCell(16).value = `${t1Tara.taraName} (${t1Tara.taraTamil})`;
        row.getCell(17).value = t1Tara.nature;

        row.getCell(18).value = `${t2Info.nakshatra} (${t2Info.tamil})`;
        row.getCell(19).value = t2Info.starNo;
        row.getCell(20).value = t2Tara.distance;
        row.getCell(21).value = `${t2Tara.taraName} (${t2Tara.taraTamil})`;
        row.getCell(22).value = t2Tara.nature;
        row.getCell(23).value = advantage;

        // Alignment and colors
        [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].forEach(c => {
            const cell = row.getCell(c);
            cell.alignment = { vertical: 'middle', horizontal: (c === 14 || c === 15 || c === 19 || c === 20 || c === 12) ? 'center' : 'left' };
        });

        // Color highlight auspicious Tara
        if (t1Tara.score >= 8) {
            row.getCell(16).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } }; // Light green
        } else if (t1Tara.score <= 3) {
            row.getCell(16).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE5CD' } }; // Light red/orange
        }

        if (t2Tara.score >= 8) {
            row.getCell(21).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
        } else if (t2Tara.score <= 3) {
            row.getCell(21).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE5CD' } };
        }

        results.push({
            matchNo,
            date: dateTimeStr,
            venue: venueStr,
            team1,
            team1Cap,
            team2,
            team2Cap,
            matchNakshatra: `${matchNak.name} (${matchNak.tamil})`,
            matchPada: matchNak.pada,
            t1Nakshatra: t1Info.nakshatra,
            t1Distance: t1Tara.distance,
            t1Tara: t1Tara.taraName,
            t2Nakshatra: t2Info.nakshatra,
            t2Distance: t2Tara.distance,
            t2Tara: t2Tara.taraName,
            advantage,
            winner
        });
    }

    // Auto-fit column widths
    sheet.columns.forEach((column, i) => {
        let maxLen = 12;
        column.eachCell({ includeEmpty: false }, cell => {
            const val = cell.value ? cell.value.toString() : '';
            if (val.length > maxLen) maxLen = Math.min(val.length + 3, 35);
        });
        column.width = maxLen;
    });

    await workbook.xlsx.writeFile(outputPath);
    console.log('Enriched Excel file successfully saved to:', outputPath);

    // Also write JSON artifact
    const jsonPath = path.join(__dirname, 'ipl_matches_astrology.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
    console.log('Saved JSON dataset to:', jsonPath);
    console.log('Processed', results.length, 'matches successfully!');
}

run().catch(err => {
    console.error('Error running astrology enrichment:', err);
});
