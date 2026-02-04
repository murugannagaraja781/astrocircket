const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000'; // Adjust if needed
const TOKEN = 'YOUR_ADMIN_TOKEN'; // This needs to be a real token to test against a live server

async function testGroupSections() {
    try {
        console.log('--- Testing Group Sections API ---');

        // 1. Create a group
        console.log('1. Creating T20 Group...');
        const createRes = await axios.post(`${BACKEND_URL}/api/groups/create`, {
            name: 'Test T20 Team',
            leagueType: 'T20'
        }, { headers: { 'x-auth-token': TOKEN } });
        const groupId = createRes.data._id;
        console.log('Created:', createRes.data.name, '-', createRes.data.leagueType);

        // 2. Move to ODI
        console.log('\n2. Moving to ODI...');
        const moveRes = await axios.put(`${BACKEND_URL}/api/groups/update-type/${groupId}`, {
            leagueType: 'ODI'
        }, { headers: { 'x-auth-token': TOKEN } });
        console.log('Updated:', moveRes.data.name, '-', moveRes.data.leagueType);

        if (moveRes.data.leagueType === 'ODI') {
            console.log('\n✅ SUCCESS: Group moved correctly.');
        } else {
            console.log('\n❌ FAILURE: Group type mismatch.');
        }

        // 3. Cleanup
        console.log('\n3. Cleaning up...');
        await axios.delete(`${BACKEND_URL}/api/groups/${groupId}`, { headers: { 'x-auth-token': TOKEN } });
        console.log('Deleted test group.');

    } catch (err) {
        console.error('Test Failed:', err.response?.data || err.message);
    }
}

// Note: This script requires a running server and valid token. 
// For automated verification in this environment, I'll check model and controller logic via analysis 
// since I cannot easily "login" and get a token without user interaction if 2FA or similar is present.
// However, I will check if I can find a way to run a local test with mongoose directly.
console.log('Verification script created. Since it requires a live token, I will also verify logic via code inspection.');
