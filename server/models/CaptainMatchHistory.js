const mongoose = require('mongoose');

const CaptainMatchHistorySchema = new mongoose.Schema({
    matchNo: {
        type: Number,
        index: true
    },
    matchTitle: {
        type: String,
        default: ''
    },
    date: {
        type: String, // e.g. '2026-03-28' or 'Sat 28 Mar'
        required: true
    },
    time: {
        type: String, // e.g. '19:30' or '7:30 PM'
        default: '19:30'
    },
    venue: {
        type: String,
        required: true
    },
    location: {
        lat: Number,
        lng: Number,
        timezone: { type: Number, default: 5.5 }
    },
    matchMoon: {
        longitude: Number,
        sign: String,
        signTamil: String,
        nakshatra: { type: String, index: true }, // e.g. 'Ashlesha'
        nakshatraTamil: String,
        pada: Number,
        starNo: Number,
        lord: String
    },
    team1: {
        name: { type: String, required: true },
        score: { type: String, default: '' },
        captain: {
            name: { type: String, required: true },
            playerId: String,
            nakshatra: String,
            nakshatraTamil: String,
            starNo: Number,
            pada: Number,
            distance: Number, // 1 to 27
            taraIndex: Number, // 0 to 8
            taraName: String,
            taraTamil: String,
            nature: String,
            score: Number
        }
    },
    team2: {
        name: { type: String, required: true },
        score: { type: String, default: '' },
        captain: {
            name: { type: String, required: true },
            playerId: String,
            nakshatra: String,
            nakshatraTamil: String,
            starNo: Number,
            pada: Number,
            distance: Number,
            taraIndex: Number,
            taraName: String,
            taraTamil: String,
            nature: String,
            score: Number
        }
    },
    astroAdvantage: {
        type: String,
        default: 'Balanced'
    },
    predictedWinner: {
        type: String,
        default: ''
    },
    winner: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

CaptainMatchHistorySchema.index({ 'matchMoon.nakshatra': 1 });
CaptainMatchHistorySchema.index({ 'team1.captain.name': 1 });
CaptainMatchHistorySchema.index({ 'team2.captain.name': 1 });
CaptainMatchHistorySchema.index({ date: -1 });

module.exports = mongoose.model('CaptainMatchHistory', CaptainMatchHistorySchema);
