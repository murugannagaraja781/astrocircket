const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
    id: { type: String, unique: true }, // Auto-generated if not provided
    name: { type: String, required: true },
    profile: { type: String, required: true },
    dob: { type: String, required: true },
    birthTime: { type: String, required: true },
    birthPlace: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timezone: { type: String, required: true },
    birthChart: { type: Object }, // Auto-generated from API, not required from user
    role: { type: String, enum: ['BAT', 'BOWL', 'ALL'], default: 'BAT', required: true },
    manualStatus: { type: String, default: '' }
});

module.exports = mongoose.model('Player', PlayerSchema);

