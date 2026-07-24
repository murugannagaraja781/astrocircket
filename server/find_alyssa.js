const http = require('http');

http.get('http://localhost:5001/api/players?limit=2500', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const body = JSON.parse(data);
            const players = body.players || [];
            const alyssa = players.find(p => p.name && p.name.toLowerCase().includes('alyssa healy'));
            if (!alyssa) {
                console.log('Alyssa Healy not found! Printing partial list of players:');
                console.log(players.slice(0, 5).map(p => p.name));
            } else {
                console.log('FOUND:', alyssa.id, alyssa.name, alyssa.role);
                // Now let's POST to prediction endpoint to get her score for Ashlesha match
                const postData = JSON.stringify({
                    playerId: alyssa.id,
                    matchDate: "2024-05-14",
                    matchTime: "17:00",
                    location: {
                        lat: 13,
                        lng: 80,
                        timezone: 5.5
                    }
                });

                const req = http.request({
                    hostname: 'localhost',
                    port: 5001,
                    path: '/api/prediction/evaluate',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                }, (res2) => {
                    let pdata = '';
                    res2.on('data', chunk => pdata += chunk);
                    res2.on('end', () => {
                        console.log("\n--- PREDICTION FOR ALYSSA HEALY (Ashlesha Match) ---");
                        const parsed = JSON.parse(pdata);
                        require('fs').writeFileSync('alyssa_score.json', JSON.stringify(parsed, null, 2), 'utf8');
                        console.log('Saved to alyssa_score.json');
                    });
                });
                req.write(postData);
                req.end();
            }
        } catch (e) { console.error('Error parsing:', e); }
    });
}).on('error', err => console.error('Error:', err));
