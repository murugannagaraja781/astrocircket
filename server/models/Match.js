const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    teamA: {
        type: String,
        required: true
    },
    teamB: {
        type: String,
        required: true
    },
    matchDate: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    matchTime: {
        type: String, // Format: HH:mm
        required: true
    },
    location: {
        name: String,
        lat: Number,
        lng: Number,
        timezone: {
            type: Number,
            default: 5.5
        }
    },
    venue: String,
    leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League'
    },
    expertPrediction: {
        predictedWinner: String, // Team A or Team B name
        keyPlayers: [{
            type: String
        }],
        reasoning: String,
        isPublished: {
            type: Boolean,
            default: false
        },
        publishedAt: Date
    },
    insightData: {
        astrologicalAdvantage: String, // Team A or Team B or Even
        keyBatsmen: [{
            name: String,
            team: String,
            role: String,
            rating: Number,
            astroScore: Number,
            rationale: String
        }],
        keyBowlers: [{
            name: String,
            team: String,
            role: String,
            rating: Number,
            astroScore: Number,
            rationale: String
        }],
        insightsSummary: String,
        price: {
            type: Number,
            default: 49
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        publishedAt: Date,
        notifiedAt: Date
    },
    status: {
        type: String,
        enum: ['upcoming', 'live', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    result: {
        winner: String,
        score: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for common queries
MatchSchema.index({ matchDate: -1 });
MatchSchema.index({ status: 1 });
MatchSchema.index({ leagueId: 1 });

module.exports = mongoose.model('Match', MatchSchema);
