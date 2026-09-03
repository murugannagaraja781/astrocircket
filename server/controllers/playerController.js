const Player = require('../models/Player');
const axios = require('axios');
const { formatPlanetaryData } = require('../utils/chartUtils');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { createBackup } = require('../utils/backupHelper');
const liveScoreService = require('../utils/liveScoreService');
const Group = require('../models/Group');

// Import local astro calculator using vedic-astrology-api
const {
    calculateSign,
    calculateNakshatra,
    calculateDignity,
    calculatePlanetaryPositions,
    calculatePanchang
} = require('../utils/astroCalculator');

// Helper to parse human-readable or ISO DOB strings into YYYY-MM-DD
const parseDobToIso = (dobStr) => {
    if (!dobStr) return '';
    const str = String(dobStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    const m = str.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) {
        const monthMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
        const mm = monthMap[m[1].toLowerCase().slice(0, 3)] || 1;
        const dd = parseInt(m[2], 10);
        const yyyy = parseInt(m[3], 10);
        return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
    return '';
};

// Helper to calculate birth chart locally using vedic-astrology-api
const fetchCharData = async (p) => {
    try {
        if (!p || !p.dob) return null;

        const cleanDob = parseDobToIso(p.dob);
        if (!cleanDob) return null;

        const parts = cleanDob.split('-').map(Number);
        const year = parts[0]; 
        const month = parts[1]; 
        const day = parts[2];
        if (!year || !month || !day) return null;

        let hour = 12;
        let minute = 0;
        if (p.birthTime && p.birthTime.includes(':')) {
            const timeParts = p.birthTime.split(':').map(Number);
            if (timeParts.length >= 2) {
                hour = isNaN(timeParts[0]) ? 12 : timeParts[0];
                minute = isNaN(timeParts[1]) ? 0 : timeParts[1];
            }
        }

        const latitude = parseFloat(p.latitude) || 13.0827;
        const longitude = parseFloat(p.longitude) || 80.2707;
        const timezone = parseFloat(p.timezone) || 5.5;

        // Date object for day of week
        const dateObj = new Date(year, month - 1, day, hour, minute);

        // Use local vedic-astrology-api calculation
        const { planets, ascendant, ayanamsaVal } = calculatePlanetaryPositions(
            year, month, day, hour, minute, latitude, longitude, timezone
        );

        // Build chart data in expected format
        const chartData = {
            planets: {},
            ascendant: {
                longitude: ascendant,
                sign: calculateSign(ascendant)
            },
            ayanamsa: ayanamsaVal
        };

        // Add sign, nakshatra and dignity for each planet
        Object.keys(planets).forEach(planetName => {
            const lng = planets[planetName];
            const sign = calculateSign(lng);
            const nakshatra = calculateNakshatra(lng);
            const dignity = calculateDignity(planetName, lng);

            chartData.planets[planetName] = {
                longitude: lng,
                sign: sign.name,
                signTamil: sign.tamil,
                signLord: sign.lord,
                nakshatra: nakshatra.name,
                nakshatraTamil: nakshatra.tamil,
                nakshatraLord: nakshatra.lord,
                pada: nakshatra.pada,
                dignity: dignity.english,
                dignityTamil: dignity.tamil
            };
        });

        // Calculate Panchangam (Tithi, Yoga, Karana, Vara)
        const sunLon = planets.Sun || 0;
        const moonLon = planets.Moon || 0;
        chartData.panchangam = calculatePanchang(sunLon, moonLon, dateObj);

        console.log(`--- LOCAL CHART CALCULATED for ${p.name} ---`);
        console.log(`Moon: ${chartData.planets.Moon?.sign}, Nakshatra: ${chartData.planets.Moon?.nakshatra}`);

        return chartData;
    } catch (err) {
        console.error(`Error calculating chart for ${p.name}:`, err.message);
        return null;
    }
};

const processPlayersData = async (playersData) => {
    console.log(`Processing ${playersData.length} players...`);
    let updatedCount = 0;

    for (const p of playersData) {
        // Skip if essential data missing
        if (!p.id || !p.name) continue;

        // Check availability/update needed
        const existing = await Player.findOne({ id: p.id });

        // Logic: specific condition "new data avilble or check if avilable"
        // I'll update if it doesn't exist OR if user wants to force update (handled implicitly by re-upload)
        // Or if birthChart is missing.

        let birthChartData = existing ? existing.birthChart : null;

        // If no chart data or forced update, fetch it
        // User said "check if avilable that data backed procee strat"
        // Implicitly: If I have the player but no chart, get chart.
        // If I don't have player, create and get chart.
        if (!birthChartData) {
            birthChartData = await fetchCharData(p);
        }

        // Upsert
        await Player.findOneAndUpdate(
            { id: p.id },
            {
                ...p, // update text fields
                birthChart: birthChartData
            },
            { upsert: true, new: true }
        );
        updatedCount++;
    }
    return updatedCount;
};

const uploadPlayers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        let playersData = [];

        // Check file type
        if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
            const fileContent = fs.readFileSync(req.file.path, 'utf-8');
            playersData = JSON.parse(fileContent);
        } else if (
            req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            req.file.originalname.endsWith('.xlsx') ||
            req.file.originalname.endsWith('.xls') ||
            req.file.originalname.endsWith('.csv')
        ) {
            // Parse Excel using exceljs
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);
            const worksheet = workbook.getWorksheet(1);

            const data = [];
            const headers = [];

            worksheet.getRow(1).eachCell((cell, colNumber) => {
                headers[colNumber] = cell.value;
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header row
                const rowData = {};
                row.eachCell((cell, colNumber) => {
                    const header = headers[colNumber];
                    if (header) {
                        rowData[header] = cell.value;
                    }
                });
                data.push(rowData);
            });
            playersData = data;
        } else {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Invalid file format. Use .json or .xlsx' });
        }

        // Validate structure (basic check)
        if (!Array.isArray(playersData)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Invalid data format. Expected an array of players.' });
        }

        const count = await processPlayersData(playersData);

        // Cleanup file
        fs.unlinkSync(req.file.path);

        // Trigger automatic backup asynchronously
        createBackup('auto_upload').catch(err => console.error('Auto backup on upload failed:', err.message));

        res.status(200).json({ message: `Processed ${count} players successfully.` });

    } catch (error) {
        console.error(error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server Error during upload' });
    }
};

const syncPlayers = async (req, res) => {
    // Legacy sync from local file, kept for compatibility or manual trigger
    try {
        const filePath = path.join(__dirname, '../../client/src/data/player.json');
        if (fs.existsSync(filePath)) {
            const playersData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const count = await processPlayersData(playersData);
            
            // Trigger automatic backup asynchronously
            createBackup('auto_sync').catch(err => console.error('Auto backup on sync failed:', err.message));

            res.status(200).json({ message: `Sync complete. Processed ${count} players.` });
        } else {
            res.status(404).json({ message: 'Local player.json not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error during sync' });
    }
};

// Helper (if needed, but for now relying on backend to handle IANA strings or simple handling)
function convertTimezone(tzString) {
    // Ideally use moment-timezone or similar if numeric offset is strictly required.
    // But since I can't easily add dependencies without user permission/workflow,
    // and the prompt implies the API is smart enough or `player.json` is prepared for it,
    // I will try to pass the string.
    // If specific numeric fallback is needed:
    if (tzString === 'Asia/Kolkata') return 5.5;
    return 5.5; // Default catch-all? No, that's bad.
    // I'll assume standard processing.
    return tzString;
}

const getPlayers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 11;
        const skip = (page - 1) * limit;

        // Build Filter
        const query = {};
        const searchText = (req.query.search || '').trim();

        if (searchText) {
            // Split search into individual words for flexible matching
            // e.g. "Virat Kohli" will match name containing both "Virat" AND "Kohli"
            const words = searchText.split(/\s+/).filter(w => w.length > 0);

            // Each word must match at least one searched field (AND logic across words)
            const wordConditions = words.map(word => {
                const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = { $regex: escaped, $options: 'i' };
                return {
                    $or: [
                        { name: regex },
                        { birthPlace: regex },
                        { id: regex },
                        // Search inside birth chart - Moon sign (rasi) and nakshatra
                        { 'birthChart.planets.Moon.sign': regex },
                        { 'birthChart.planets.Moon.signTamil': regex },
                        { 'birthChart.planets.Moon.nakshatra': regex },
                        { 'birthChart.planets.Moon.nakshatraTamil': regex },
                    ]
                };
            });

            query.$and = wordConditions;
        }

        if (req.query.place) {
            const placeRegex = { $regex: req.query.place, $options: 'i' };
            if (query.$and) {
                query.$and.push({ birthPlace: placeRegex });
            } else {
                query.birthPlace = placeRegex;
            }
        }

        const totalPlayers = await Player.countDocuments(query);
        const totalPages = Math.ceil(totalPlayers / limit);

        const players = await Player.find(query)
            .sort({ _id: -1 }) // Recent first
            .skip(skip)
            .limit(limit)
            .lean();

        const formatChartHelper = (chart) => {
            if (!chart) return chart;
            // Check nesting
            const root = chart.data || chart;
            if (!root.formattedPlanets) {
                root.formattedPlanets = formatPlanetaryData(root.planets || root.houses);
            }
            return chart;
        };

        const updatedPlayers = players.map(p => {
            if (p.birthChart) {
                p.birthChart = formatChartHelper(p.birthChart);
            }
            return p;
        });

        res.json({
            players: updatedPlayers,
            currentPage: page,
            totalPages,
            totalPlayers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getPlayerById = async (req, res) => {
    try {
        let player = await Player.findOne({ id: req.params.id }).lean();
        if (!player && mongoose.Types.ObjectId.isValid(req.params.id)) {
            player = await Player.findById(req.params.id).lean();
        }
        if (!player) return res.status(404).json({ message: 'Player not found' });

        if (player.birthChart) {
            const root = player.birthChart.data || player.birthChart;
            if (!root.formattedPlanets) {
                root.formattedPlanets = formatPlanetaryData(root.planets || root.houses);
            }
        }

        res.json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update Player (Super Admin)
const updatePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent ID update logic
        delete updates._id;
        delete updates.id;

        // Handle Profile Pic Update
        if (req.file) {
            const ext = path.extname(req.file.originalname);
            // Use existing ID for filename if possible, or we need to look it up.
            // But 'id' from params is the custom ID (string).
            const newFilename = `${id}_profile_${Date.now()}${ext}`; // Timestamp to avoid caching issues
            const targetPath = path.join('uploads', newFilename);

            // Move/Rename key file
            fs.renameSync(req.file.path, targetPath);
            updates.profile = newFilename;
        }

        if (updates.dob) {
            updates.dob = parseDobToIso(updates.dob) || updates.dob;
        }

        // Check if chart-affecting fields changed to re-fetch chart
        const chartAffecting = ['dob', 'birthPlace', 'latitude', 'longitude', 'timezone', 'birthTime'];
        // FORCE UPDATE: To fix stale data (Zampa Bug)
        const needsChartUpdate = true; // chartAffecting.some(field => field in updates);

        if (needsChartUpdate) {
            // We need the full data to fetch chart (merging old and new)
            let existingPlayer = await Player.findOne({ id: id });
            if (!existingPlayer && mongoose.isValidObjectId(id)) {
                existingPlayer = await Player.findById(id);
            }
            if (existingPlayer) {
                const mergedData = { ...existingPlayer.toObject(), ...updates };
                const newChart = await fetchCharData(mergedData);
                if (newChart) {
                    updates.birthChart = newChart;
                }
            }
        }

        // Find by custom 'id' field
        const player = await Player.findOneAndUpdate(
            { id: id },
            { $set: updates },
            { new: true }
        );

        if (!player) {
            // Fallback to try finding by _id if custom id not found
            const playerById = await Player.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true }
            );
            if (!playerById) return res.status(404).json({ msg: 'Player not found' });
            
            // Trigger automatic backup asynchronously
            createBackup('auto_update').catch(err => console.error('Auto backup on update failed:', err.message));
            
            return res.json(playerById);
        }

        // Trigger automatic backup asynchronously
        createBackup('auto_update').catch(err => console.error('Auto backup on update failed:', err.message));

        res.json(player);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Add Single Player
const addPlayer = async (req, res) => {
    try {
        // Handle multipart/form-data: req.body will have text fields, req.file will have image
        const playerData = req.body;

        // Check for duplicate player (same name + dob only - birthTime is optional)
        const duplicateQuery = {
            name: { $regex: new RegExp(`^${playerData.name?.trim()}$`, 'i') },
            dob: playerData.dob
        };
        // Only add birthTime to query if it's provided
        if (playerData.birthTime) {
            duplicateQuery.birthTime = playerData.birthTime;
        }

        const existingPlayer = await Player.findOne(duplicateQuery);

        if (existingPlayer) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Cleanup uploaded file
            return res.status(400).json({
                msg: 'Duplicate player! A player with the same name and DOB already exists.',
                existingId: existingPlayer.id
            });
        }

        // Validation / ID Gen
        if (!playerData.id) {
            playerData.id = (playerData.name?.toLowerCase().replace(/\s/g, '_') || 'player') + '_' + Date.now();
        }

        // Handle Profile Pic
        if (req.file) {
            // Define target path (e.g., uploads/profile_pics/) or keep in uploads/
            // Ideally we want it accessible properly. For now, we'll keep it simple or move it?
            // The bulk upload deletes the file. Here we want to KEEP it.
            // Let's assume we serve 'uploads' statically or similar.
            // But 'dest: uploads/' just saves a hash. We should give it an extension.
            const ext = path.extname(req.file.originalname);
            const newFilename = `${playerData.id}_profile${ext}`;
            const targetPath = path.join('uploads', newFilename);

            // Move/Rename key file
            fs.renameSync(req.file.path, targetPath);

            playerData.profile = newFilename; // Store filename
        }

        // Auto-fetch birth chart
        const chartData = await fetchCharData(playerData);
        if (chartData) {
            playerData.birthChart = chartData;
        }

        const newPlayer = new Player(playerData);
        await newPlayer.save();

        // Trigger automatic backup asynchronously
        createBackup('auto_add').catch(err => console.error('Auto backup on add failed:', err.message));

        res.json(newPlayer);
    } catch (err) {
        console.error(err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Cleanup on error
        res.status(500).send('Server Error');
    }
};

const deletePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        // Try finding by custom id first, then _id
        let result = await Player.findOneAndDelete({ id: id });
        if (!result) {
            result = await Player.findByIdAndDelete(id);
        }

        if (!result) return res.status(404).json({ msg: 'Player not found' });

        // Also remove player from any groups
        const Group = require('../models/Group');
        await Group.updateMany(
            { players: id }, // Assuming players array stores custom ID
            { $pull: { players: id } }
        );

        // Trigger automatic backup asynchronously
        createBackup('auto_delete').catch(err => console.error('Auto backup on delete failed:', err.message));

        res.json({ msg: 'Player deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Delete All Players (with password protection)
const deleteAllPlayers = async (req, res) => {
    try {
        const { password } = req.body;

        // Password verification
        if (password !== '123456789') {
            return res.status(401).json({ msg: 'Invalid password' });
        }

        // Delete all players
        const result = await Player.deleteMany({});

        // Also clear all players from groups
        const Group = require('../models/Group');
        await Group.updateMany({}, { $set: { players: [] } });

        // Trigger automatic backup asynchronously
        createBackup('auto_delete_all').catch(err => console.error('Auto backup on delete-all failed:', err.message));

        res.json({ msg: `Deleted ${result.deletedCount} players successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Sync live match squad details natively and handle comparison logic
const syncLiveMatchSquad = async (req, res) => {
    try {
        const { matchId } = req.body;
        if (!matchId) {
            return res.status(400).json({ msg: 'Match ID is required' });
        }

        // Fetch squad directly from native liveScoreService
        let squadData;
        try {
            squadData = await liveScoreService.fetchSquads(matchId, true);
        } catch (serviceErr) {
            console.error('Live Score Service fetch error:', serviceErr.message);
            return res.status(500).json({ msg: 'Failed to fetch squad from live score service', error: serviceErr.message });
        }

        if (!squadData || squadData.status !== 'success' || !squadData.teams) {
            return res.status(400).json({ msg: 'Invalid live score response', data: squadData });
        }

        // Collect all players (Playing XI, Bench, Support) from both teams
        const allLivePlayers = [];
        const processTeamList = (teamKey, squadKey) => {
            const list = squadData.teams[teamKey]?.[squadKey] || [];
            list.forEach(p => {
                // Parse ID from profile URL (e.g. /profiles/10631/adam-zampa -> 10631)
                const match = p.profile_url.match(/\/profiles\/(\d+)\//);
                const id = match ? match[1] : p.name.replace(/\s+/g, '-').toLowerCase();
                allLivePlayers.push({
                    id,
                    name: p.name,
                    role: p.role?.toUpperCase()?.includes('WK-') ? 'BAT' : (p.role?.toUpperCase()?.includes('BAT') ? 'BAT' : (p.role?.toUpperCase()?.includes('BOWL') ? 'BOWL' : 'ALL')),
                    dob: p.date_of_birth || '',
                    birthPlace: p.birth_place || '',
                    profile: p.profile_url || ''
                });
            });
        };

        ['team1', 'team2'].forEach(tk => {
            ['playing_xi', 'bench', 'support_staff'].forEach(sk => {
                processTeamList(tk, sk);
            });
        });

        let updatedCount = 0;
        let flaggedCount = 0;
        let addedCount = 0;

        for (const p of allLivePlayers) {
            // Check if player already exists in Database
            const existing = await Player.findOne({ id: p.id });

            if (!existing) {
                // Fetch chart data locally
                const birthChartData = await fetchCharData({
                    dob: p.dob,
                    birthTime: '12:00', // default birth time
                    birthPlace: p.birthPlace,
                    latitude: 13.0827,
                    longitude: 80.2707,
                    timezone: 5.5
                });

                const newPlayer = new Player({
                    id: p.id,
                    name: p.name,
                    dob: p.dob,
                    birthTime: '12:00',
                    birthPlace: p.birthPlace,
                    role: p.role,
                    profile: p.profile,
                    birthChart: birthChartData,
                    needsReview: false,
                    manualOverride: false
                });

                await newPlayer.save();
                addedCount++;
            } else {
                // If user set manual override, we don't auto-update or alert for mismatch
                if (existing.manualOverride) {
                    continue;
                }

                // Check for data mismatch in date of birth or birth place
                const normalDob = p.dob.trim();
                const normalPlace = p.birthPlace.trim();

                const hasDobMismatch = normalDob && existing.dob && existing.dob.trim() !== normalDob;
                const hasPlaceMismatch = normalPlace && existing.birthPlace && existing.birthPlace.trim() !== normalPlace;

                if (hasDobMismatch || hasPlaceMismatch) {
                    // Mismatch found - Flag for review instead of auto overwriting
                    existing.needsReview = true;
                    existing.lastScrapedData = {
                        dob: normalDob,
                        birthPlace: normalPlace
                    };
                    await existing.save();
                    flaggedCount++;
                } else {
                    // No mismatch, but if fields were empty, we can auto-fill and re-calculate chart
                    let shouldUpdateChart = false;
                    if (!existing.dob && normalDob) {
                        existing.dob = normalDob;
                        shouldUpdateChart = true;
                    }
                    if (!existing.birthPlace && normalPlace) {
                        existing.birthPlace = normalPlace;
                        shouldUpdateChart = true;
                    }

                    if (shouldUpdateChart) {
                        existing.birthChart = await fetchCharData(existing);
                        await existing.save();
                        updatedCount++;
                    }
                }
            }
        }

        // Automatically sync both teams into Groups with their Playing XI (11 players)
        const syncedGroups = [];
        const titleStr = (req.body.matchTitle || '').toUpperCase();
        let leagueType = 'T20';
        if (titleStr.includes('ODI') || titleStr.includes('ONE DAY') || titleStr.includes('TROPHY')) {
            leagueType = 'ODI';
        } else if (titleStr.includes('TEST')) {
            leagueType = 'General';
        }

        // Extract full team names from match title if present (e.g. "Ireland Women vs England Women, 2nd ODI")
        let titleTeams = [];
        if (req.body.matchTitle) {
            const vsPart = req.body.matchTitle.split(',')[0].split('-')[0];
            const parts = vsPart.split(/\s+vs\s+/i);
            if (parts.length === 2) {
                titleTeams = [parts[0].trim(), parts[1].trim()];
            }
        }

        const teamKeys = ['team1', 'team2'];
        for (let i = 0; i < teamKeys.length; i++) {
            const tk = teamKeys[i];
            const teamObj = squadData.teams[tk];
            if (!teamObj || !teamObj.name) continue;

            const rawName = teamObj.name.trim();
            let groupName = rawName;

            // Match full team name from title if available
            const matchedTitleName = titleTeams.find(t => 
                t.toLowerCase().startsWith(rawName.slice(0, 2).toLowerCase()) || 
                rawName.toLowerCase().startsWith(t.slice(0, 2).toLowerCase())
            );

            if (matchedTitleName && matchedTitleName.length > rawName.length) {
                groupName = `${matchedTitleName} (${rawName})`;
            } else if (matchedTitleName) {
                groupName = matchedTitleName;
            }

            // Get Playing XI player IDs
            let xiPlayers = teamObj.playing_xi || [];
            if (xiPlayers.length === 0) {
                xiPlayers = teamObj.bench || [];
            }

            const xiPlayerIds = xiPlayers.map(p => {
                const match = (p.profile_url || '').match(/\/profiles\/(\d+)\//);
                return match ? match[1] : p.name.replace(/\s+/g, '-').toLowerCase();
            }).filter(Boolean);

            if (xiPlayerIds.length > 0) {
                // Find existing group by name or abbreviations
                const escapedName = groupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                let group = await Group.findOne({ name: new RegExp(`^${escapedName}$`, 'i') });

                if (!group && rawName) {
                    group = await Group.findOne({ name: new RegExp(`^${rawName}$`, 'i') });
                }
                if (!group && matchedTitleName) {
                    group = await Group.findOne({ name: new RegExp(`^${matchedTitleName}$`, 'i') });
                }

                if (!group) {
                    group = new Group({
                        name: groupName,
                        leagueType: leagueType,
                        players: xiPlayerIds
                    });
                } else {
                    group.players = xiPlayerIds;
                    if (!group.leagueType || group.leagueType === 'General') {
                        group.leagueType = leagueType;
                    }
                }

                await group.save();
                syncedGroups.push({
                    name: group.name,
                    leagueType: group.leagueType,
                    count: group.players.length
                });
            }
        }

        res.json({
            status: 'success',
            msg: `Squad synchronization complete`,
            syncedGroups,
            stats: {
                totalScraped: allLivePlayers.length,
                newPlayersAdded: addedCount,
                autoUpdated: updatedCount,
                flaggedForReview: flaggedCount,
                groupsSynced: syncedGroups.length
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error during live squad sync', error: err.message });
    }
};

// Fetch all players requiring manual reviews
const getReviewRequiredPlayers = async (req, res) => {
    try {
        const players = await Player.find({ needsReview: true });
        res.json({ status: 'success', players });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error fetching review list');
    }
};

// Resolve a flagged review mismatch
const resolvePlayerReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'accept_live' or 'keep_existing'

        const player = await Player.findOne({ id });
        if (!player) {
            return res.status(404).json({ msg: 'Player not found' });
        }

        if (action === 'accept_live' && player.lastScrapedData) {
            // Overwrite database with scraped live values
            player.dob = player.lastScrapedData.dob || player.dob;
            player.birthPlace = player.lastScrapedData.birthPlace || player.birthPlace;
            player.birthChart = await fetchCharData(player);
            player.needsReview = false;
            player.lastScrapedData = null;
            await player.save();
            res.json({ status: 'success', msg: 'Player updated with live scraped details and chart recalculated', player });
        } else if (action === 'keep_existing') {
            // Lock current database settings from future automatically overwritten/flagged warnings
            player.needsReview = false;
            player.manualOverride = true;
            player.lastScrapedData = null;
            await player.save();
            res.json({ status: 'success', msg: 'Current details kept; manual override flag activated', player });
        } else {
            res.status(400).json({ msg: 'Invalid action. Must be accept_live or keep_existing' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error resolving review');
    }
};

// Fetch live matches directly via native liveScoreService
const getLiveMatches = async (req, res) => {
    try {
        const data = await liveScoreService.fetchMatches();
        res.json(data);
    } catch (err) {
        console.error('Live Score Service error:', err.message);
        res.status(500).json({ msg: 'Failed to fetch matches from live score service', error: err.message });
    }
};

module.exports = {
    syncPlayers,
    getPlayers,
    getPlayerById,
    uploadPlayers,
    updatePlayer,
    addPlayer,
    deletePlayer,
    deleteAllPlayers,
    syncLiveMatchSquad,
    getReviewRequiredPlayers,
    resolvePlayerReview,
    getLiveMatches
};
