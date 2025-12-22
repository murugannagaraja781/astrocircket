const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true }, // "Team A", "Team B", or specific names
    description: { type: String },
    players: [{ type: String }], // Store Player IDs (custom `id`)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', GroupSchema);
