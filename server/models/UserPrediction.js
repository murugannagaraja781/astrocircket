const mongoose = require('mongoose');

const UserPredictionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // We will use a composite string or specific details to identify the match
    // since we might not have a rigorous Match ID system for every arbitrary match entry in the wizard.
    matchDate: {
        type: String,
        required: true
    },
    teamA: {
        type: String,
        required: true
    },
    teamB: {
        type: String,
        required: true
    },
    predictedWinner: {
        type: String, // "Team A" name or "Team B" name
        required: true
    },
    starPlayers: [{
        type: String // Player Names or IDs. We'll store Names for easier display if IDs change/are temporary.
    }],
    actualWinner: {
        type: String, // "Team A" name or "Team B" name
        default: null
    },
    leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserPrediction', UserPredictionSchema);
