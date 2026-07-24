const mongoose = require('mongoose');
const Group = require('./server/models/Group');
const groupController = require('./server/controllers/groupController');

async function verifyLogic() {
    try {
        console.log('Connecting to MongoDB...');
        // Use a local test DB or the existing one if safe
        await mongoose.connect('mongodb://localhost:27017/astro_cricket_test', { useNewUrlParser: true, useUnifiedTopology: true });

        console.log('Testing Group Model creation...');
        const testGroup = new Group({
            name: 'Test Logic Team',
            leagueType: 'T20'
        });
        await testGroup.save();
        console.log('Saved:', testGroup.name, '-', testGroup.leagueType);

        console.log('Testing LeagueType update...');
        // Mocking req/res for controller
        const req = { params: { id: testGroup._id }, body: { leagueType: 'ODI' } };
        const res = {
            json: (data) => console.log('Controller Response (JSON):', data.name, '-', data.leagueType),
            status: (code) => ({ send: (msg) => console.log('Error:', code, msg), json: (msg) => console.log('Error:', code, msg) })
        };

        await groupController.updateGroupType(req, res);

        // Verification
        const updated = await Group.findById(testGroup._id);
        if (updated.leagueType === 'ODI') {
            console.log('✅ Logic Verified: LeagueType updated correctly.');
        } else {
            console.log('❌ Logic Failed: LeagueType not updated.');
        }

        // Cleanup
        await Group.deleteOne({ _id: testGroup._id });
        console.log('Cleanup done.');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Verification Error:', err);
        process.exit(1);
    }
}

verifyLogic();
