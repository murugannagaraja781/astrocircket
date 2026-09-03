const Group = require('../models/Group');
const Player = require('../models/Player');
const mongoose = require('mongoose');

// Get All Groups with Populated Players
const getGroups = async (req, res) => {
    try {
        const groups = await Group.find({}).lean();
        
        // Populate players safely
        const populatedGroups = await Promise.all(groups.map(async (group) => {
            if (!group.players || !Array.isArray(group.players) || group.players.length === 0) {
                return { ...group, players: [] };
            }

            // Valid player IDs (non-empty strings)
            const validPlayerIds = group.players.filter(id => id && typeof id === 'string' && id.trim().length > 0);
            if (validPlayerIds.length === 0) {
                return { ...group, players: [] };
            }

            const objectIds = validPlayerIds
                .filter(id => mongoose.isValidObjectId(id))
                .map(id => new mongoose.Types.ObjectId(id));

            const playerDetails = await Player.find({
                $or: [
                    { id: { $in: validPlayerIds } },
                    ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : [])
                ]
            }).lean();

            return {
                ...group,
                players: playerDetails
            };
        }));

        res.json(populatedGroups);
    } catch (err) {
        console.error('Error in getGroups:', err);
        res.status(500).send('Server Error');
    }
};

// Create or Update Group (Add players)
const addPlayersToGroup = async (req, res) => {
    try {
        const { groupName, playerIds, leagueType } = req.body;
        if (!groupName) return res.status(400).json({ msg: 'Group name is required' });

        let group = await Group.findOne({ name: groupName });
        if (!group) {
            group = new Group({ name: groupName, players: [], leagueType: leagueType || 'General' });
        }

        const validIdsToAdd = (Array.isArray(playerIds) ? playerIds : [])
            .map(id => (typeof id === 'string' ? id.trim() : String(id)))
            .filter(Boolean);

        const currentPlayers = group.players || [];
        
        // Add unique players
        const newPlayers = validIdsToAdd.filter(id => !currentPlayers.includes(id));
        group.players.push(...newPlayers);

        await group.save();
        res.json(group);
    } catch (err) {
        console.error('Error in addPlayersToGroup:', err);
        res.status(500).send('Server Error');
    }
};

// Remove Player from Group
const removePlayerFromGroup = async (req, res) => {
    try {
        const { groupName, playerId } = req.body;
        if (!groupName || !playerId) return res.status(400).json({ msg: 'Group name and Player ID are required' });

        const group = await Group.findOne({ name: groupName });
        if (group) {
            group.players = (group.players || []).filter(id => id !== playerId && id !== String(playerId));
            await group.save();
        }
        res.json(group);
    } catch (err) {
        console.error('Error in removePlayerFromGroup:', err);
        res.status(500).send('Server Error');
    }
};



// Clear Group
const clearGroup = async (req, res) => {
    try {
        const { id } = req.body;
        if (id) {
            await Group.findByIdAndUpdate(id, { $set: { players: [] } });
        }
        res.json({ msg: 'Cleared' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Create New Group
const createGroup = async (req, res) => {
    try {
        const { name, description, leagueType } = req.body;
        if (!name) return res.status(400).json({ msg: 'Name is required' });

        const existing = await Group.findOne({ name });
        if (existing) return res.status(400).json({ msg: 'Group already exists' });

        const group = new Group({ name, description, leagueType: leagueType || 'General', players: [] });
        await group.save();
        res.json(group);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Update Group Type
const updateGroupType = async (req, res) => {
    try {
        const { id } = req.params;
        const { leagueType } = req.body;

        const group = await Group.findByIdAndUpdate(id, { leagueType }, { new: true });
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        res.json(group);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Delete Group
const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        await Group.findByIdAndDelete(id);
        res.json({ msg: 'Group deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

module.exports = { getGroups, addPlayersToGroup, removePlayerFromGroup, clearGroup, createGroup, deleteGroup, updateGroupType };
