const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
 id: { type: String },
 name: { type: String, required: true },
 profile: { type: String, default: '' },
 dob: { type: String, default: '' },
 birthTime: { type: String, default: '09:00' },
 birthPlace: { type: String, default: '' },
 latitude: { type: Number, default: 13.0827 },
 longitude: { type: Number, default: 80.2707 },
 timezone: { type: String, default: '5.5' },
 birthChart: { type: Object },
 role: { type: String, enum: ['BAT', 'BOWL', 'ALL'], default: 'BAT' },
 gender: { type: String, enum: ['Male', 'Female', ''], default: '' },
 league: { type: String, default: '' },
 manualStatus: { type: String, default: '' },
 needsReview: { type: Boolean, default: false },
 lastScrapedData: { type: Object, default: null },
 manualOverride: { type: Boolean, default: false }
});

// Auto-generate unique custom id if missing before saving
PlayerSchema.pre('save', function () {
    if (!this.id) {
        const cleanName = (this.name || 'player').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        this.id = `${cleanName}_${Date.now()}`;
    }
});

// Indexes for fast player search
PlayerSchema.index({ name: 'text', birthPlace: 'text' });
PlayerSchema.index({ name: 1 });
PlayerSchema.index({ league: 1 });

module.exports = mongoose.model('Player', PlayerSchema);
