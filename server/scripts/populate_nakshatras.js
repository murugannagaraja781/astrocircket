require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const Match = require('../models/Match');
const { calculatePlanetaryPositions, calculateNakshatra, NAKSHATRAS } = require('../utils/astroCalculator');

// Map for quick English <-> Tamil lookup
const NAK_MAP = {};
NAKSHATRAS.forEach(n => {
    NAK_MAP[n.name.toLowerCase()] = n;
    NAK_MAP[n.tamil] = n;
});

function parseTime(timeStr) {
    let hour = 14, minute = 0;
    if (!timeStr) return { hour, minute };

    const istMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?\s*IST/i);
    if (istMatch) {
        hour = parseInt(istMatch[1]);
        minute = parseInt(istMatch[2]);
        const ampm = istMatch[3] ? istMatch[3].toUpperCase() : null;
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        return { hour, minute, isIST: true };
    }

    const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
    if (ampmMatch) {
        hour = parseInt(ampmMatch[1]);
        minute = parseInt(ampmMatch[2]);
        const ampm = ampmMatch[3].toUpperCase();
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        return { hour, minute };
    }

    const h24Match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (h24Match) {
        hour = parseInt(h24Match[1]);
        minute = parseInt(h24Match[2]);
        return { hour, minute };
    }

    return { hour, minute };
}

async function populateAll() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB. Populating Nakshatra for all matches...\n');

    const matches = await Match.find({});
    console.log(`Total matches in DB: ${matches.length}`);

    let updatedCount = 0;

    for (const m of matches) {
        let nakName = '';
        let nakTamil = '';
        let nakLord = '';

        // If matchDate exists
        if (m.matchDate) {
            const dateParts = m.matchDate.split('-');
            if (dateParts.length === 3) {
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                const day = parseInt(dateParts[2]);

                const { hour, minute, isIST } = parseTime(m.matchTime);
                const lat = m.location?.lat || 20.5937;
                const lng = m.location?.lng || 78.9629;
                const tz = isIST ? 5.5 : (m.location?.timezone || 5.5);

                try {
                    const astro = calculatePlanetaryPositions(year, month, day, hour, minute, lat, lng, tz);
                    if (astro && astro.planets && typeof astro.planets.Moon === 'number') {
                        const moonNak = calculateNakshatra(astro.planets.Moon);
                        if (moonNak && moonNak.name) {
                            nakName = moonNak.name;
                            nakTamil = moonNak.tamil || moonNak.name;
                            nakLord = moonNak.lord || '';
                        }
                    }
                } catch (err) {
                    console.warn(`Could not compute astro for match ${m._id}:`, err.message);
                }
            }
        }

        if (nakName) {
            m.nakshatra = nakName;
            m.nakshatraTamil = nakTamil;
            m.nakshatraLord = nakLord;
            await m.save();
            updatedCount++;
        }
    }

    console.log(`\n🎉 Successfully calculated & updated Nakshatra for ${updatedCount} matches!`);

    const sample = await Match.findOne({ nakshatra: { $ne: null } }).lean();
    console.log('\nSample match with Nakshatra:');
    console.log({
        id: sample._id,
        series: sample.series,
        match: `${sample.teamA} vs ${sample.teamB}`,
        date: sample.matchDate,
        nakshatra: sample.nakshatra,
        nakshatraTamil: sample.nakshatraTamil,
        nakshatraLord: sample.nakshatraLord
    });

    const distinctNaks = await Match.distinct('nakshatra');
    console.log(`\nDistinct Nakshatras across all matches (${distinctNaks.length}):`, distinctNaks);

    await mongoose.disconnect();
}

populateAll().catch(console.error);

