const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Player = require('../models/Player');
const Group = require('../models/Group');

// Helper to parse human-readable or ISO DOB strings into YYYY-MM-DD
const parseDobToIso = (dobStr) => {
    if (!dobStr) return '';
    const str = String(dobStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    
    const slashOrDash = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (slashOrDash) {
        let p1 = parseInt(slashOrDash[1], 10);
        let p2 = parseInt(slashOrDash[2], 10);
        const yyyy = slashOrDash[3];
        if (p1 > 12) return `${yyyy}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
        if (p2 > 12) return `${yyyy}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
        return `${yyyy}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }

    const monthMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const m = str.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) {
        const mm = monthMap[m[1].toLowerCase().slice(0, 3)] || 1;
        const dd = parseInt(m[2], 10);
        const yyyy = parseInt(m[3], 10);
        return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }

    const dmy = str.match(/(\d{1,2})\s+([a-zA-Z]+),?\s+(\d{4})/);
    if (dmy) {
        const dd = parseInt(dmy[1], 10);
        const mm = monthMap[dmy[2].toLowerCase().slice(0, 3)] || 1;
        const yyyy = parseInt(dmy[3], 10);
        return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return '';
};

// Check if two DOBs represent the exact same date
const isDobMatching = (dob1, dob2) => {
    if (!dob1 || !dob2) return true;
    const iso1 = parseDobToIso(dob1);
    const iso2 = parseDobToIso(dob2);
    if (!iso1 || !iso2) return true;
    return iso1 === iso2;
};

// Check if two birth places match or are compatible
const isPlaceMatching = (p1, p2) => {
    const s1 = (p1 || '').trim().toLowerCase();
    const s2 = (p2 || '').trim().toLowerCase();
    if (!s1 || !s2 || s1 === 'n/a' || s2 === 'n/a') return true;
    if (s1 === s2) return true;
    if (s1.includes(s2) || s2.includes(s1)) return true;
    return false;
};

// Score player record completeness to pick the best primary record
const scorePlayerRecord = (p) => {
    let score = 0;
    // User manual edit flags (highest priority)
    if (p.manualOverride) score += 50;
    if (p.isTobLocked) score += 50;
    // Non-default customized birthTime
    if (p.birthTime && p.birthTime !== '09:00' && p.birthTime !== '12:00') score += 40;
    // Has full birthChart calculated
    if (p.birthChart && Object.keys(p.birthChart).length > 0) score += 30;
    // Has DOB
    if (p.dob && p.dob.trim()) score += 20;
    // Has BirthPlace
    if (p.birthPlace && p.birthPlace.trim() && p.birthPlace !== 'N/A') score += 15;
    // Has Cricbuzz ID or numeric ID
    if (p.cricbuzzId || /^\d+$/.test(p.id)) score += 10;
    // Has Profile image
    if (p.profile && p.profile.trim()) score += 5;
    return score;
};

async function mergeDuplicatePlayers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
        console.log('Connected to MongoDB successfully!\n');

        const totalBefore = await Player.countDocuments();
        console.log(`Total players in DB before cleanup: ${totalBefore}`);

        // Fetch all players
        const allPlayers = await Player.find({});
        console.log(`Fetched ${allPlayers.length} players. Analyzing duplicate clusters...`);

        // Group by normalized name
        const nameGroups = new Map();
        for (const p of allPlayers) {
            const cleanName = (p.name || '').trim().toLowerCase();
            if (!cleanName) continue;
            if (!nameGroups.has(cleanName)) {
                nameGroups.set(cleanName, []);
            }
            nameGroups.get(cleanName).push(p);
        }

        let totalMergedClusters = 0;
        let totalDeletedDuplicates = 0;
        const mergedReport = [];

        for (const [name, players] of nameGroups.entries()) {
            if (players.length <= 1) continue;

            // Partition players with the same name based on DOB and Birth Place
            // (Note: birthTime is NOT checked because it is manually edited)
            const subClusters = [];

            for (const player of players) {
                let addedToSubCluster = false;

                for (const cluster of subClusters) {
                    const representative = cluster[0];

                    const dobMatch = isDobMatching(representative.dob, player.dob);
                    const placeMatch = isPlaceMatching(representative.birthPlace, player.birthPlace);

                    const repIsoDob = parseDobToIso(representative.dob);
                    const playerIsoDob = parseDobToIso(player.dob);
                    const repPlace = (representative.birthPlace || '').trim().toLowerCase();
                    const playerPlace = (player.birthPlace || '').trim().toLowerCase();

                    const bothHaveDob = Boolean(repIsoDob && playerIsoDob);
                    const bothHavePlace = Boolean(repPlace && repPlace !== 'n/a' && playerPlace && playerPlace !== 'n/a');

                    // True duplicate condition:
                    // If both have DOB, they must match.
                    // If both have Place, they must match.
                    let isSamePerson = false;
                    if (bothHaveDob && bothHavePlace) {
                        isSamePerson = dobMatch && placeMatch;
                    } else if (bothHaveDob) {
                        isSamePerson = dobMatch;
                    } else if (bothHavePlace) {
                        isSamePerson = placeMatch;
                    } else {
                        // Neither has differentiating data, and name is identical
                        isSamePerson = true;
                    }

                    if (isSamePerson) {
                        cluster.push(player);
                        addedToSubCluster = true;
                        break;
                    }
                }

                if (!addedToSubCluster) {
                    subClusters.push([player]);
                }
            }

            // For each sub-cluster with > 1 players, merge into 1 primary record
            for (const cluster of subClusters) {
                if (cluster.length <= 1) continue;

                // Sort cluster so best record comes first
                cluster.sort((a, b) => scorePlayerRecord(b) - scorePlayerRecord(a));

                const primary = cluster[0];
                const duplicates = cluster.slice(1);

                const duplicateDocIds = [];
                const duplicatePlayerIds = [];

                for (const dup of duplicates) {
                    duplicateDocIds.push(dup._id);
                    if (dup.id && dup.id !== primary.id) {
                        duplicatePlayerIds.push(dup.id);
                    }
                    if (dup.cricbuzzId && !primary.cricbuzzId) {
                        primary.cricbuzzId = dup.cricbuzzId;
                    } else if (/^\d+$/.test(dup.id) && !primary.cricbuzzId) {
                        primary.cricbuzzId = dup.id;
                    }
                    if (!primary.profile && dup.profile) primary.profile = dup.profile;
                    if (!primary.dob && dup.dob) primary.dob = dup.dob;
                    if ((!primary.birthPlace || primary.birthPlace === 'N/A') && dup.birthPlace && dup.birthPlace !== 'N/A') {
                        primary.birthPlace = dup.birthPlace;
                    }
                    if (!primary.birthChart && dup.birthChart) primary.birthChart = dup.birthChart;
                    if (!primary.jerseyNumber && dup.jerseyNumber) primary.jerseyNumber = dup.jerseyNumber;
                }

                // Save primary
                await primary.save();

                // Delete duplicates
                if (duplicateDocIds.length > 0) {
                    await Player.deleteMany({ _id: { $in: duplicateDocIds } });
                    totalDeletedDuplicates += duplicateDocIds.length;
                }

                // Update Group references (replace duplicate player IDs with primary.id)
                if (duplicatePlayerIds.length > 0) {
                    for (const dupId of duplicatePlayerIds) {
                        // Find groups containing dupId
                        const affectedGroups = await Group.find({ players: dupId });
                        for (const group of affectedGroups) {
                            group.players = group.players.map(pId => (pId === dupId ? primary.id : pId));
                            // Deduplicate group players array
                            group.players = [...new Set(group.players)];
                            await group.save();
                        }
                    }
                }

                totalMergedClusters++;
                mergedReport.push({
                    name: primary.name,
                    keptId: primary.id,
                    cricbuzzId: primary.cricbuzzId,
                    dob: primary.dob,
                    birthPlace: primary.birthPlace,
                    removedCount: duplicates.length,
                    removedIds: duplicatePlayerIds
                });
            }
        }

        const totalAfter = await Player.countDocuments();

        console.log('\n=============================================');
        console.log('        DUPLICATE MERGE COMPLETED           ');
        console.log('=============================================');
        console.log(`Initial Players:     ${totalBefore}`);
        console.log(`Players Merged:      ${totalMergedClusters} player clusters`);
        console.log(`Duplicates Removed:  ${totalDeletedDuplicates}`);
        console.log(`Remaining Players:   ${totalAfter}`);
        console.log('=============================================\n');

        console.log('Top 15 Merged Samples:');
        mergedReport.slice(0, 15).forEach(m => {
            console.log(`✓ ${m.name} | Kept ID: ${m.keptId} | Cricbuzz ID: ${m.cricbuzzId || 'none'} | Merged ${m.removedCount} copies: [${m.removedIds.join(', ')}]`);
        });

        await mongoose.disconnect();
        return { totalBefore, totalAfter, totalDeletedDuplicates, mergedReport };
    } catch (err) {
        console.error('Error during duplicate merge:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    mergeDuplicatePlayers();
}

module.exports = { mergeDuplicatePlayers };
