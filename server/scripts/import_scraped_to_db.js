require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Match = require('../models/Match');

async function importAll() {
    const dataDir = path.join(__dirname, '..', 'scraped_data');
    if (!fs.existsSync(dataDir)) {
        console.log('No scraped_data folder found.');
        return;
    }

    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/astrocricket');
    console.log('Connected to MongoDB.');

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    let totalImported = 0;

    for (const file of files) {
        const filePath = path.join(dataDir, file);
        try {
            const matches = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (!Array.isArray(matches)) continue;

            console.log(`Importing ${matches.length} matches from ${file}...`);
            for (const m of matches) {
                if (!m.cricbuzzMatchId && !m.matchTitle) continue;

                const query = m.cricbuzzMatchId 
                    ? { cricbuzzMatchId: String(m.cricbuzzMatchId) } 
                    : { teamA: m.teamA, teamB: m.teamB, matchDate: m.matchDate };

                const updateDoc = {
                    teamA: m.teamA || 'Team A',
                    teamB: m.teamB || 'Team B',
                    matchDate: m.matchDate || new Date().toISOString().split('T')[0],
                    matchTime: m.matchTime || '19:30',
                    venue: m.venue || 'Cricket Stadium',
                    format: m.format || 'T20',
                    series: m.series || file.replace('.json', '').replace(/_/g, ' ').toUpperCase(),
                    toss: m.toss || '',
                    status: 'completed',
                    location: {
                        name: m.city || m.venue || 'Stadium',
                        lat: m.location?.lat || 20.5937,
                        lng: m.location?.lng || 78.9629,
                        timezone: 5.5
                    },
                    result: {
                        winner: m.result?.winner || '',
                        score: m.result?.score || '',
                        margin: m.result?.margin || ''
                    }
                };

                await Match.findOneAndUpdate(
                    query,
                    { $set: updateDoc },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                totalImported++;
            }
        } catch (err) {
            console.error(`Error importing ${file}:`, err.message);
        }
    }

    console.log(`🎉 Total ${totalImported} match records processed and saved into MongoDB!`);
    await mongoose.disconnect();
}

importAll().catch(console.error);
