const Group = require('../models/Group');

// Get All Groups
const getGroups = async (req, res) => {
    try {
        const groups = await Group.find();
        res.json(groups);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Create or Update Group (Add players)
const addPlayersToGroup = async (req, res) => {
    try {
        const { groupName, playerIds } = req.body;

        let group = await Group.findOne({ name: groupName });
        if (!group) {
            group = new Group({ name: groupName, players: [] });
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

module.exports = { getGroups, addPlayersToGroup, removePlayerFromGroup, clearGroup };
