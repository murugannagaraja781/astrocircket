const Group = require('../models/Group');

// Get All Groups with Populated Players
const getGroups = async (req, res) => {
    try {
        // Use aggregation to join with players collection based on custom 'id'
        const groups = await Group.aggregate([
            {
                $lookup: {
                    from: 'players', // Ensure this matches your actual collection name (lowercase plural usually)
                    localField: 'players',
                    foreignField: 'id',
                    as: 'playerDetails'
                }
            },
            {
                $addFields: {
                    players: '$playerDetails' // Overwrite string array with object array
                }
            },
            {
                $project: {
                    playerDetails: 0 // Remove the temp field
                }
            }
        ]);
        res.json(groups);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Create or Update Group (Add players)
const addPlayersToGroup = async (req, res) => {
    try {
        const { groupName, playerIds, leagueType } = req.body;

        let group = await Group.findOne({ name: groupName });
        if (!group) {
            group = new Group({ name: groupName, players: [], leagueType: leagueType || 'General' });
        }

        // Add unique players
        const newPlayers = playerIds.filter(id => !group.players.includes(id));
        group.players.push(...newPlayers);

        await group.save();
        res.json(group);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Remove Player from Group
const removePlayerFromGroup = async (req, res) => {
    try {
        const { groupName, playerId } = req.body;
        const group = await Group.findOne({ name: groupName });
        if (group) {
            group.players = group.players.filter(id => id !== playerId);
            await group.save();
        }
        res.json(group);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Clear Group
const clearGroup = async (req, res) => {
    try {
        const { groupName } = req.body;
        if (groupName) {
            await Group.updateOne({ name: groupName }, { $set: { players: [] } });
        } else {
            // Clear all for restart?
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
