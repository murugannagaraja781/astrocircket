require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('../models/Match');

async function cleanDuplicates() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB. Starting Duplicate Cleanup...\n');

    // Specifically identified junk/duplicate IDs
    const duplicateIdsToRemove = [
        // 1. Upcoming duplicate of completed match 171307 (India A vs NZ A)
        '6aed04c65573aa312f416b38',
        // 2. Upcoming duplicate of completed match 161260 (NZ vs IND)
        '6ae9469f05c077d33c0bb506',
        // 3. Upcoming duplicate of match 174977 (IRE vs NAM)
        '6ae59b8205c077d33c0b518c',
        // 4. Upcoming duplicate of match 172727 (AFG vs ZIM)
        '6aeac97e05c077d33c0bd2c1',
        // 5. Incomplete dummy "Hong Kong vs Team B" for 175193
        '6ae42676fd076a70ad3407d2',
        // 6. Old live/undefined scraper duplicates of Nepal Premier League matches
        '6ae5ddac05c077d33c0b5917', // Kathmandu vs Janakpur
        '6ae5ac7e05c077d33c0b554a', // Biratnagar vs Sudur Paschim (mislabeled under WBBL)
        '6ae7253305c077d33c0b6aba', // Chitwan vs Sudur Paschim
        '6ae5ddac05c077d33c0b5916', // Karnali vs Janakpur
        '6ae6e0b705c077d33c0b65d1', // Karnali vs Kathmandu
        '6ae5ccb605c077d33c0b5810', // Biratnagar vs Chitwan
        // 7. Old mislabeled duplicate of Lions vs Titans
        '6ae5e05e05c077d33c0b5928',
        // 8. Redundant upcoming Mexico Women vs Argentina Women
        '6addc631b134df903c767279'
    ];

    console.log(`Targeting ${duplicateIdsToRemove.length} duplicate/redundant records for removal.`);
    const result = await Match.deleteMany({ _id: { $in: duplicateIdsToRemove } });
    console.log(`✅ Successfully deleted ${result.deletedCount} duplicate match records!`);

    const finalTotal = await Match.countDocuments();
    const finalCompleted = await Match.countDocuments({ status: { $in: ['completed', 'finished'] } });
    console.log(`\n📊 Final DB Status:`);
    console.log(`   - Total Matches: ${finalTotal}`);
    console.log(`   - Total Completed Matches: ${finalCompleted}`);

    await mongoose.disconnect();
}

cleanDuplicates().catch(console.error);
