require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('../models/Match');

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/astrocricket');
    const total = await Match.countDocuments();
    const completed = await Match.countDocuments({ status: { $in: ['completed', 'finished'] } });
    const series = await Match.distinct('series');
    const sampleCompleted = await Match.find({ status: { $in: ['completed', 'finished'] } }).limit(5).select('teamA teamB matchDate venue series status result');
    console.log(JSON.stringify({ total, completed, series, sampleCompleted }, null, 2));
    await mongoose.disconnect();
}
check().catch(console.error);
