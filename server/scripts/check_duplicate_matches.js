require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('../models/Match');

async function checkDuplicates() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB. Checking for duplicates in Match collection...\n');

    // 1. Check duplicate cricbuzzMatchId
    const dupCricbuzz = await Match.aggregate([
        { $match: { cricbuzzMatchId: { $exists: true, $ne: '', $ne: null } } },
        { $group: { _id: '$cricbuzzMatchId', count: { $sum: 1 }, docs: { $push: { id: '$_id', series: '$series', teamA: '$teamA', teamB: '$teamB', date: '$matchDate' } } } },
        { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`1. Duplicate cricbuzzMatchId found: ${dupCricbuzz.length}`);
    if (dupCricbuzz.length > 0) {
        console.log('Duplicates by cricbuzzMatchId:');
        console.log(JSON.stringify(dupCricbuzz, null, 2));
    }

    // 2. Check duplicate (teamA + teamB + matchDate)
    const dupTeamsDate = await Match.aggregate([
        {
            $project: {
                teamA: 1,
                teamB: 1,
                matchDate: 1,
                series: 1,
                status: 1,
                cricbuzzMatchId: 1,
                // Normalized pair (alphabetical so A vs B == B vs A)
                normPair: {
                    $cond: [
                        { $lt: ['$teamA', '$teamB'] },
                        { $concat: ['$teamA', '_VS_', '$teamB', '_ON_', '$matchDate'] },
                        { $concat: ['$teamB', '_VS_', '$teamA', '_ON_', '$matchDate'] }
                    ]
                }
            }
        },
        {
            $group: {
                _id: '$normPair',
                count: { $sum: 1 },
                matches: {
                    $push: {
                        _id: '$_id',
                        series: '$series',
                        teamA: '$teamA',
                        teamB: '$teamB',
                        date: '$matchDate',
                        cricbuzzId: '$cricbuzzMatchId',
                        status: '$status'
                    }
                }
            }
        },
        { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`\n2. Duplicate Matches by (Teams + MatchDate): ${dupTeamsDate.length}`);
    if (dupTeamsDate.length > 0) {
        console.log('\nDetails of duplicate matches:');
        dupTeamsDate.forEach((d, i) => {
            console.log(`\n--- Duplicate #${i + 1} (${d.count} entries) ---`);
            console.log(`Key: ${d._id}`);
            d.matches.forEach(m => console.log(`  - [${m._id}] series="${m.series}", ${m.teamA} vs ${m.teamB}, date=${m.date}, cricbuzzId=${m.cricbuzzId}, status=${m.status}`));
        });
    }

    await mongoose.disconnect();
}

checkDuplicates().catch(console.error);
