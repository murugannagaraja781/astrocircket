const mongoose = require('mongoose');
require('dotenv').config();
const Match = require('../models/Match');

async function fixPastMatches() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    const today = new Date().toISOString().split('T')[0]; // e.g. 2026-11-15
    console.log('Today is:', today);

    // 1. Specifically fix the 5 WBBL 2025 matches
    const res2025 = await Match.updateMany(
        { status: 'upcoming', matchDate: { $regex: '^2025' } },
        { $set: { status: 'completed' } }
    );
    console.log(`✅ Updated ${res2025.modifiedCount} matches from 2025 to 'completed'.`);

    // 2. Also fix past matches from 2026 prior to today that have results or were completed
    const pastMatches = await Match.find({
        status: 'upcoming',
        matchDate: { $lt: today }
    });

    console.log(`Found ${pastMatches.length} remaining past matches before ${today} marked as upcoming.`);
    let completedCount = 0;
    for (const m of pastMatches) {
        m.status = 'completed';
        if (!m.result || !m.result.margin) {
            m.result = m.result || {};
            m.result.margin = m.subStatus || 'Match completed';
        }
        await m.save();
        completedCount++;
        console.log(`- Set completed: [${m._id}] ${m.teamA} vs ${m.teamB} (${m.matchDate})`);
    }

    console.log(`\n🎉 Total past upcoming matches moved to 'completed': ${res2025.modifiedCount + completedCount}`);
    process.exit(0);
}

fixPastMatches().catch(err => {
    console.error('Error fixing past matches:', err);
    process.exit(1);
});
