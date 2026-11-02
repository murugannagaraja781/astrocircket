/**
 * ==============================================================================
 * ASTROCRICKET - CRICBUZZ BULK SERIES SCRAPER & EXPORTER
 * ==============================================================================
 * Scrapes all matches from any Cricbuzz series, extracts:
 *   - Date & Time in IST
 *   - Venue & City
 *   - Team A vs Team B
 *   - Toss (Winner & Decision)
 *   - Match Result & Score
 * 
 * Exports to:
 *   1. JSON file (scraped_data/<series>.json)
 *   2. Excel file (scraped_data/<series>.xlsx)
 *   3. MongoDB Database (Optional via --save-to-db)
 *
 * Usage:
 *   node scripts/bulk_series_scraper.js
 *   node scripts/bulk_series_scraper.js --url "<cricbuzz_series_url>"
 *   node scripts/bulk_series_scraper.js --series <seriesId>
 *   node scripts/bulk_series_scraper.js --save-to-db
 * ==============================================================================
 */

require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache'
};

const clean = (text) => text ? text.replace(/\s+/g, ' ').trim() : '';
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// Popular Indian & International Venues with Lat/Lng for Astrology calculation
const VENUE_COORDINATES = {
    'chennai': { lat: 13.0628, lng: 80.2793 },
    'bengaluru': { lat: 12.9788, lng: 77.5996 },
    'bangalore': { lat: 12.9788, lng: 77.5996 },
    'mumbai': { lat: 18.9389, lng: 72.8258 },
    'kolkata': { lat: 22.5646, lng: 88.3433 },
    'ahmedabad': { lat: 23.0917, lng: 72.5975 },
    'delhi': { lat: 28.6379, lng: 77.2425 },
    'hyderabad': { lat: 17.4065, lng: 78.5505 },
    'jaipur': { lat: 26.8940, lng: 75.8032 },
    'lucknow': { lat: 26.8105, lng: 81.0146 },
    'chandigarh': { lat: 30.7333, lng: 76.7794 },
    'dharamsala': { lat: 32.2190, lng: 76.3234 },
    'lahore': { lat: 31.5204, lng: 74.3587 },
    'karachi': { lat: 24.8607, lng: 67.0011 },
    'colombo': { lat: 6.9271, lng: 79.8612 },
    'kandy': { lat: 7.2906, lng: 80.6337 },
    'melbourne': { lat: -37.8136, lng: 144.9631 },
    'sydney': { lat: -33.8688, lng: 151.2093 },
    'cape town': { lat: -33.9249, lng: 18.4241 },
    'johannesburg': { lat: -26.2041, lng: 28.0473 },
    'london': { lat: 51.5074, lng: -0.1278 }
};

function getVenueCoordinates(venueString) {
    if (!venueString) return { lat: 20.5937, lng: 78.9629 };
    const lower = venueString.toLowerCase();
    for (const [city, coords] of Object.entries(VENUE_COORDINATES)) {
        if (lower.includes(city)) return coords;
    }
    return { lat: 20.5937, lng: 78.9629 };
}

/**
 * Clean & Format team names (e.g., "IND" -> "India", "CSK" -> "Chennai Super Kings")
 */
const TEAM_NAMES_MAP = {
    'ind': 'India',
    'nz': 'New Zealand',
    'aus': 'Australia',
    'pak': 'Pakistan',
    'sl': 'Sri Lanka',
    'sa': 'South Africa',
    'rsa': 'South Africa',
    'eng': 'England',
    'wi': 'West Indies',
    'ban': 'Bangladesh',
    'afg': 'Afghanistan',
    'ire': 'Ireland',
    'zim': 'Zimbabwe',
    'csk': 'Chennai Super Kings',
    'mi': 'Mumbai Indians',
    'rcb': 'Royal Challengers Bengaluru',
    'kkr': 'Kolkata Knight Riders',
    'dc': 'Delhi Capitals',
    'srh': 'Sunrisers Hyderabad',
    'rr': 'Rajasthan Royals',
    'pbks': 'Punjab Kings',
    'gt': 'Gujarat Titans',
    'lsg': 'Lucknow Super Giants'
};

function normalizeTeamName(name) {
    if (!name) return 'Team';
    const cleanName = clean(name);
    const lower = cleanName.toLowerCase();
    return TEAM_NAMES_MAP[lower] || cleanName;
}

/**
 * 1. Find all matches in a series URL
 */
async function fetchSeriesMatches(seriesUrl) {
    console.log(`\n🌐 Fetching Series matches page: ${seriesUrl}`);
    const res = await axios.get(seriesUrl, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(res.data);

    let seriesTitle = clean($('title').text());
    seriesTitle = seriesTitle.replace(/schedule.*$/i, '').replace(/\|.*$/i, '').trim();

    const matchesList = [];

    // Find all match links inside page body (excluding top ticker)
    $('a[href*="/live-cricket-scores/"], a[href*="/cricket-scores/"]').each((_, a) => {
        if ($(a).parents('.h-10, [class*="bg-[#4a4a4a]"]').length > 0) return;

        const href = $(a).attr('href') || '';
        const m = href.match(/\/(\d+)\//);
        if (!m) return;

        const matchId = m[1];
        const linkText = clean($(a).text());

        if (linkText.includes('vs') && !matchesList.some(x => x.matchId === matchId)) {
            matchesList.push({
                matchId,
                title: linkText,
                href: href.startsWith('http') ? href : `https://www.cricbuzz.com${href}`
            });
        }
    });

    // Extract series slug from URL to filter matches accurately
    const slugMatch = seriesUrl.match(/cricket-series\/\d+\/([^/]+)/);
    const seriesSlug = slugMatch ? slugMatch[1].toLowerCase() : '';
    const slugKeywords = seriesSlug.split('-').filter(w => w.length > 2 && !['and', 'the', 'tour', 'matches'].includes(w));

    let finalMatches = matchesList;
    if (slugKeywords.length > 0) {
        const seriesSpecific = matchesList.filter(m => {
            const h = m.href.toLowerCase();
            const t = m.title.toLowerCase();
            return slugKeywords.some(k => h.includes(k) || t.includes(k)) ||
                   (seriesSlug.includes('big-bash') && (h.includes('wbbl') || h.includes('bbl') || t.includes('women')));
        });
        if (seriesSpecific.length > 0) {
            finalMatches = seriesSpecific;
        }
    }

    console.log(`✅ Series: "${seriesTitle}"`);
    console.log(`📋 Found ${finalMatches.length} specific matches in this series.\n`);
    return { seriesTitle, matchesList: finalMatches };
}

/**
 * 2. Scrape detailed data for a single match (Facts & Scorecard)
 */
async function scrapeMatchDetails(matchSummary, seriesName) {
    const { matchId, title } = matchSummary;

    const data = {
        cricbuzzMatchId: String(matchId),
        series: seriesName || 'Cricket Series',
        matchTitle: title,
        teamA: '',
        teamB: '',
        matchDate: '',
        matchTime: '',
        venue: '',
        city: '',
        location: { lat: 20.5937, lng: 78.9629 },
        format: 'T20',
        toss: '',
        result: {
            winner: '',
            margin: '',
            score: ''
        },
        status: 'completed'
    };

    // A. Fetch Match Facts
    try {
        const factsUrl = `https://www.cricbuzz.com/cricket-match-facts/${matchId}`;
        const factsRes = await axios.get(factsUrl, { headers: HEADERS, timeout: 10000 });
        const $f = cheerio.load(factsRes.data);

        $f('div').each((_, el) => {
            const label = clean($f(el).text());
            const val = clean($f(el).next().text());

            if (label === 'Match') {
                if (val.includes(' vs ')) {
                    const vsParts = val.split(' vs ');
                    data.teamA = normalizeTeamName(vsParts[0]);
                    const bPart = vsParts[1].split('•')[0].split(',')[0].trim();
                    data.teamB = normalizeTeamName(bPart);
                }
            } else if (label === 'Date') {
                // Parse date e.g. "Tuesday, October 27, 2026" or "May 26, 2024"
                const d = new Date(val);
                if (!isNaN(d.getTime())) {
                    data.matchDate = d.toISOString().split('T')[0];
                } else {
                    data.matchDate = val;
                }
            } else if (label === 'Time') {
                // e.g. "10:30 AM LOCAL, 8:30 AM GMT, 2:00 PM IST"
                const istMatch = val.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(?:IST|\(IST\))/i);
                if (istMatch) {
                    data.matchTime = istMatch[1].trim();
                } else {
                    const anyTime = val.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
                    if (anyTime) data.matchTime = anyTime[1].trim();
                }
            } else if (label === 'Venue') {
                data.venue = val;
                data.location = getVenueCoordinates(val);
                const parts = val.split(',');
                if (parts.length > 1) {
                    data.city = clean(parts[parts.length - 1]);
                }
            } else if (label === 'Toss') {
                data.toss = val;
            }
        });

        // Determine format (T20, ODI, Test)
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('t20')) data.format = 'T20';
        else if (lowerTitle.includes('odi')) data.format = 'ODI';
        else if (lowerTitle.includes('test')) data.format = 'TEST';
        else data.format = 'T20';

    } catch (err) {
        console.warn(`  ⚠️ Could not fetch facts for ${matchId}: ${err.message}`);
    }

    // Fallback for team names if not found
    if (!data.teamA || !data.teamB) {
        if (title.includes(' vs ')) {
            const parts = title.split(' vs ');
            data.teamA = normalizeTeamName(parts[0]);
            data.teamB = normalizeTeamName(parts[1].split(' ')[0]);
        }
    }

    // B. Fetch Scorecard (Outcome / Winner)
    try {
        const scUrl = `https://www.cricbuzz.com/live-cricket-scorecard/${matchId}`;
        const scRes = await axios.get(scUrl, { headers: HEADERS, timeout: 10000 });
        const $s = cheerio.load(scRes.data);

        // Find result text
        $s('*').each((_, el) => {
            const t = clean($s(el).text());
            if ((t.includes('won by') || t.includes('Match tied') || t.includes('drawn') || t.includes('won the match')) && t.length < 80 && !data.result.margin) {
                data.result.margin = t;
                if (t.includes(' won by ')) {
                    const winnerName = clean(t.split(' won by ')[0]);
                    data.result.winner = normalizeTeamName(winnerName);
                } else if (t.includes(' won the match')) {
                    const winnerName = clean(t.split(' won the match')[0]);
                    data.result.winner = normalizeTeamName(winnerName);
                }
            }
        });
    } catch (err) {
        console.warn(`  ⚠️ Could not fetch scorecard for ${matchId}: ${err.message}`);
    }

    return data;
}

/**
 * 3. Export to Excel Spreadsheet (.xlsx)
 */
async function exportToExcel(matches, seriesTitle, outputFilePath) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AstroCricket Scraper Engine';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Matches Data');

    // Header styling
    sheet.columns = [
        { header: '#', key: 'idx', width: 6 },
        { header: 'Match ID', key: 'cricbuzzMatchId', width: 14 },
        { header: 'Date', key: 'matchDate', width: 14 },
        { header: 'Time (IST)', key: 'matchTime', width: 14 },
        { header: 'Team A', key: 'teamA', width: 22 },
        { header: 'Team B', key: 'teamB', width: 22 },
        { header: 'Format', key: 'format', width: 10 },
        { header: 'Venue', key: 'venue', width: 32 },
        { header: 'City', key: 'city', width: 16 },
        { header: 'Toss Details', key: 'toss', width: 34 },
        { header: 'Winner', key: 'winner', width: 22 },
        { header: 'Match Result', key: 'margin', width: 32 }
    ];

    sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0C2340' } // Navy blue
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
            city: m.city,
            toss: m.toss,
            winner: m.result?.winner || '',
            margin: m.result?.margin || ''
        });
    });

    await workbook.xlsx.writeFile(outputFilePath);
    console.log(`📊 Excel Spreadsheet exported: ${outputFilePath}`);
}

/**
 * 4. Save/Upsert into MongoDB
 */
async function saveToDatabase(matches) {
    if (!process.env.MONGO_URI) {
        console.warn('⚠️ MONGO_URI not found in .env, skipping MongoDB save.');
        return;
    }

    try {
        console.log('\n💾 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        const Match = require('../models/Match');

        let insertedCount = 0;
        let updatedCount = 0;

        for (const m of matches) {
            const query = { cricbuzzMatchId: m.cricbuzzMatchId };
            const updateDoc = {
                teamA: m.teamA,
                teamB: m.teamB,
                matchDate: m.matchDate || '2026-01-01',
                matchTime: m.matchTime || '19:30',
                venue: m.venue || 'Stadium',
                format: m.format,
                series: m.series || '',
                toss: m.toss || '',
                status: 'completed',
                location: {
                    name: m.city || m.venue,
                    lat: m.location.lat,
                    lng: m.location.lng,
                    timezone: 5.5
                },
                result: {
                    winner: m.result.winner || '',
                    score: m.result.score || '',
                    margin: m.result.margin || ''
                }
            };

            const res = await Match.findOneAndUpdate(
                query,
                { $set: updateDoc },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            if (res) updatedCount++;
        }

        console.log(`✅ Successfully saved/updated ${updatedCount} matches directly into MongoDB!`);
        await mongoose.disconnect();
    } catch (dbErr) {
        console.error('❌ MongoDB save error:', dbErr.message);
    }
}

/**
 * Main Scraper Orchestrator
 */
async function run() {
    const args = process.argv.slice(2);
    let targetUrl = '';
    let saveToDb = args.includes('--save-to-db') || args.includes('--db');

    // Parse URL from argument
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--url' && args[i + 1]) {
            targetUrl = args[i + 1];
        } else if (args[i] === '--series' && args[i + 1]) {
            targetUrl = `https://www.cricbuzz.com/cricket-series/${args[i + 1]}/matches`;
        }
    }

    // Default target if none provided (India tour of New Zealand 2026)
    if (!targetUrl) {
        targetUrl = 'https://www.cricbuzz.com/cricket-series/12543/india-tour-of-new-zealand-2026/matches';
        console.log(`ℹ️ No --url specified. Using sample series: ${targetUrl}`);
        console.log(`👉 You can specify any series: node scripts/bulk_series_scraper.js --url "<cricbuzz_url>" [--save-to-db]`);
    }

    try {
        const { seriesTitle, matchesList } = await fetchSeriesMatches(targetUrl);

        if (matchesList.length === 0) {
            console.log('❌ No matches found for this series URL. Please check the URL.');
            return;
        }

        console.log(`🚀 Starting bulk scrape of ${matchesList.length} matches...\n`);
        const scrapedMatches = [];

        for (let i = 0; i < matchesList.length; i++) {
            const m = matchesList[i];
            process.stdout.write(`[${i + 1}/${matchesList.length}] Scraping Match ${m.matchId} (${m.title})... `);
            const detail = await scrapeMatchDetails(m, seriesTitle);
            scrapedMatches.push(detail);
            console.log(`Done! (${detail.teamA} vs ${detail.teamB} - ${detail.result?.winner ? 'Winner: ' + detail.result.winner : 'Finished'})`);
            // Brief sleep to avoid hitting Cricbuzz rate limits
            await sleep(800);
        }

        // Create output directory
        const outputDir = path.join(__dirname, '../scraped_data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const safeSeriesName = seriesTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        const jsonPath = path.join(outputDir, `${safeSeriesName}.json`);
        const excelPath = path.join(outputDir, `${safeSeriesName}.xlsx`);

        // 1. Save JSON
        fs.writeFileSync(jsonPath, JSON.stringify(scrapedMatches, null, 2), 'utf8');
        console.log(`\n📁 Complete JSON data saved: ${jsonPath}`);

        // 2. Export Excel
        await exportToExcel(scrapedMatches, seriesTitle, excelPath);

        // 3. Save to MongoDB if requested
        if (saveToDb) {
            await saveToDatabase(scrapedMatches);
        } else {
            console.log('\n💡 Tip: Run with --save-to-db to import these matches directly into your app database:');
            console.log(`   node scripts/bulk_series_scraper.js --url "${targetUrl}" --save-to-db\n`);
        }

        console.log(`🎉 ALL DONE! Successfully extracted ${scrapedMatches.length} matches with full details.`);
    } catch (err) {
        console.error('❌ Scraper error:', err.message);
    }
}

run();
