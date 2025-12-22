const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    profile: { type: String },
    dob: { type: String },
    birthTime: { type: String }, // New field for HH:mm
    birthPlace: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    timezone: { type: String },
    birthChart: { type: Object } // Store the entire JSON response here
});

module.exports = mongoose.model('Player', PlayerSchema);
