require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const Match = require('../models/Match');

const TEAM_NAMES = {
    // WBBL
    'MLRW': 'Melbourne Renegades Women',
    'SYTW': 'Sydney Thunder Women',
    'MLSW': 'Melbourne Stars Women',
    'HBHW': 'Hobart Hurricanes Women',
    'BRHW': 'Brisbane Heat Women',
    'SYSW': 'Sydney Sixers Women',
    'ADSW': 'Adelaide Strikers Women',
    'PRSW': 'Perth Scorchers Women',
    // WPL
    'MIW': 'Mumbai Indians Women',
    'RCBW': 'Royal Challengers Bengaluru Women',
    'GGTW': 'Gujarat Giants Women',
    'UPW': 'UP Warriorz',
    'DCW': 'Delhi Capitals Women',
    // BBL
    'PRS': 'Perth Scorchers',
    'SYS': 'Sydney Sixers',
    'MLR': 'Melbourne Renegades',
    'BRH': 'Brisbane Heat',
    'HBH': 'Hobart Hurricanes',
    'SYT': 'Sydney Thunder',
    'ADS': 'Adelaide Strikers',
    'MLS': 'Melbourne Stars',
    // IPL
    'RCB': 'Royal Challengers Bengaluru',
    'SRH': 'Sunrisers Hyderabad',
    'MI': 'Mumbai Indians',
    'KKR': 'Kolkata Knight Riders',
    'RR': 'Rajasthan Royals',
    'CSK': 'Chennai Super Kings',
    'PBKS': 'Punjab Kings',
    'GT': 'Gujarat Titans',
    'LSG': 'Lucknow Super Giants',
    'DC': 'Delhi Capitals',
    // International
    'NZ': 'New Zealand',
    'IND': 'India'
};

function getTeamName(code, fullName) {
    if (fullName && fullName.trim().length > 0 && fullName !== 'TBC') return fullName.trim();
    if (code && TEAM_NAMES[code]) return TEAM_NAMES[code];
    return code || 'Team';
}

function normalizeDate(dStr) {
    if (!dStr) return new Date().toISOString().split('T')[0];
    if (dStr.includes('/')) {
        const parts = dStr.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
    }
    if (dStr.includes('-')) {
        const parts = dStr.split('-');
        if (parts[0].length === 4) return dStr;
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
    }
    return dStr;
}

function getSeriesSlug(seriesName) {
    return seriesName
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

async function exportToExcel(matches, seriesTitle, outputFilePath) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AstroCricket Migration Engine';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Matches Data');

    sheet.columns = [
        { header: '#', key: 'idx', width: 6 },
        { header: 'Match ID', key: 'cricbuzzMatchId', width: 14 },
        { header: 'Date', key: 'matchDate', width: 14 },
        { header: 'Time (IST)', key: 'matchTime', width: 16 },
        { header: 'Team A', key: 'teamA', width: 30 },
        { header: 'Team B', key: 'teamB', width: 30 },
        { header: 'Format', key: 'format', width: 10 },
        { header: 'Venue', key: 'venue', width: 45 },
        { header: 'Toss Details', key: 'toss', width: 40 },
        { header: 'Winner', key: 'winner', width: 30 },
        { header: 'Match Result', key: 'margin', width: 40 }
    ];

    sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0C2340' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    matches.forEach((m, idx) => {
        sheet.addRow({
            idx: idx + 1,
            cricbuzzMatchId: m.cricbuzzMatchId,
            matchDate: m.matchDate,
            matchTime: m.matchTime,
            teamA: m.teamA,
            teamB: m.teamB,
            format: m.format,
            venue: m.venue,
            toss: m.toss,
            winner: m.result?.winner || '',
            margin: m.result?.margin || ''
        });
    });

    await workbook.xlsx.writeFile(outputFilePath);
}

async function importAll() {
    console.log('🚀 Starting Import of KP-ASTRO & kp_match_horai Historical Matches...\n');

    // 1. Gather all raw records
    const allRaw = [];
    const idSet = new Set();

    // Source A: Shared Preferences from kp_match_horai
    const prefsPath = 'C:/Users/abina/AppData/Roaming/com.example/kp_match_horai/shared_preferences.json';
    if (fs.existsSync(prefsPath)) {
        try {
            const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
            const matchesRaw = prefs['flutter.saved_match_predictions_v1'] || [];
            console.log(`📂 Found ${matchesRaw.length} raw matches in kp_match_horai shared_preferences.json`);
            matchesRaw.forEach(item => {
                try {
                    const parsed = JSON.parse(item);
                    if (parsed) allRaw.push(parsed);
                } catch (e) {}
            });
        } catch (err) {
            console.error('Error reading shared_preferences.json:', err.message);
        }
    }

    // Source B: Assets wbbl_2026_matches.json
    const assetsWbbl = 'C:/Users/abina/ASTROLOGY-APP/KP-ASTRO/kp_match_horai/assets/wbbl_2026_matches.json';
    if (fs.existsSync(assetsWbbl)) {
        try {
            const arr = JSON.parse(fs.readFileSync(assetsWbbl, 'utf8'));
            if (Array.isArray(arr)) {
                console.log(`📂 Found ${arr.length} matches in kp_match_horai/assets/wbbl_2026_matches.json`);
                arr.forEach(m => allRaw.push(m));
            }
        } catch (err) {
            console.error('Error reading assets wbbl:', err.message);
        }
    }

    console.log(`\n🔍 Total raw items collected across sources: ${allRaw.length}`);

    // Deduplicate and normalize
    const processedMatches = [];
    for (const m of allRaw) {
        const id = String(m.id || m.matchId || '').trim();
        const date = normalizeDate(m.date);
        const teamA = getTeamName(m.teamA, m.teamAFull);
        const teamB = getTeamName(m.teamB, m.teamBFull);
        const key = id ? id : `${teamA}_vs_${teamB}_${date}`;

        if (idSet.has(key)) continue;
        idSet.add(key);

        const tossWinnerName = getTeamName(m.tossWinner);
        let tossDesc = '';
        if (m.toss) {
            tossDesc = m.toss;
        } else if (m.tossWinner) {
            if (m.firstBatting) {
                const decision = (m.firstBatting === m.tossWinner) ? 'bat' : 'bowl';
                tossDesc = `${tossWinnerName} won the toss and opted to ${decision}`;
            } else {
                tossDesc = `${tossWinnerName} won the toss`;
            }
        }

        const winnerName = m.matchWinner ? getTeamName(m.matchWinner) : '';
        const isComplete = (m.state === 'Complete' || Boolean(m.matchWinner));

        const doc = {
            cricbuzzMatchId: id || undefined,
            teamA,
            teamB,
            matchDate: date,
            matchTime: m.istTime || m.time || '19:30',
            venue: m.venue || 'Cricket Stadium',
            format: m.format || 'T20',
            series: m.series || 'Cricket Series',
            toss: tossDesc || 'Toss details unavailable',
            status: isComplete ? 'completed' : 'upcoming',
            subStatus: m.margin || (winnerName ? `${winnerName} Won` : ''),
            location: {
                name: m.venue || 'Stadium',
                lat: m.lat || 0,
                lng: m.lon || 0,
                timezone: m.tz || 5.5
            },
            result: {
                winner: winnerName,
                score: '',
                margin: m.margin || ''
            }
        };

        processedMatches.push(doc);
    }

    console.log(`✅ Normalized & Deduplicated into ${processedMatches.length} unique match records.`);

    // Group by series
    const seriesGroups = {};
    processedMatches.forEach(m => {
        const s = m.series;
        if (!seriesGroups[s]) seriesGroups[s] = [];
        seriesGroups[s].push(m);
    });

    console.log('\n📊 Breakdown by Series:');
    for (const [ser, list] of Object.entries(seriesGroups)) {
        const comp = list.filter(x => x.status === 'completed').length;
        const up = list.filter(x => x.status === 'upcoming').length;
        console.log(`   - ${ser}: ${list.length} matches (${comp} completed, ${up} upcoming)`);
    }

    // 2. Export each series to scraped_data folder (.json and .xlsx)
    const scrapedDir = path.join(__dirname, '..', 'scraped_data');
    if (!fs.existsSync(scrapedDir)) fs.mkdirSync(scrapedDir, { recursive: true });

    console.log('\n📁 Exporting scraped_data JSON & Excel files...');
    for (const [ser, list] of Object.entries(seriesGroups)) {
        const slug = getSeriesSlug(ser);
        const jsonPath = path.join(scrapedDir, `${slug}.json`);
        const xlsxPath = path.join(scrapedDir, `${slug}.xlsx`);

        // Save JSON as an array so routes/matches.js lists proper matchCount
        fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), 'utf8');

        // Save Excel
        try {
            await exportToExcel(list, ser, xlsxPath);
            console.log(`   💾 Exported: ${slug}.json and ${slug}.xlsx (${list.length} matches)`);
        } catch (e) {
            console.warn(`   ⚠️ Could not write Excel for ${slug}:`, e.message);
        }
    }

    // 3. Upsert into MongoDB
    console.log('\n💾 Connecting to MongoDB to insert/update matches...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    let inserted = 0;
    let updated = 0;

    for (const m of processedMatches) {
        const query = m.cricbuzzMatchId
            ? { cricbuzzMatchId: m.cricbuzzMatchId }
            : { teamA: m.teamA, teamB: m.teamB, matchDate: m.matchDate };

        const res = await Match.findOneAndUpdate(
            query,
            { $set: m },
            { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
        );

        if (res.lastErrorObject?.updatedExisting) {
            updated++;
        } else {
            inserted++;
        }
    }

    console.log(`\n🎉 Database Upsert Completed:`);
    console.log(`   - Newly Inserted: ${inserted}`);
    console.log(`   - Updated Existing: ${updated}`);

    const finalTotal = await Match.countDocuments();
    const finalCompleted = await Match.countDocuments({ status: { $in: ['completed', 'finished'] } });
    const finalSeries = await Match.distinct('series', { status: { $in: ['completed', 'finished'] }, series: { $ne: '' } });

    console.log(`\n📊 Final MongoDB Old Matches Status:`);
    console.log(`   - Total Matches in DB: ${finalTotal}`);
    console.log(`   - Total Completed Matches: ${finalCompleted}`);
    console.log(`   - Tracked Series (${finalSeries.length}):\n     * ${finalSeries.join('\n     * ')}`);

    await mongoose.disconnect();
    console.log('\n✨ All operations finished successfully!');
}

importAll().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
