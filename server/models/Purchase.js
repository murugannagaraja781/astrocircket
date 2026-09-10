const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
    userId: {
        type: String, // Can be MongoDB ObjectId or Firebase UID
        required: true,
        index: true
    },
    userEmail: {
        type: String
    },
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
        index: true
    },
    merchantTransactionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    phonepeTransactionId: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
        default: 'PENDING',
        index: true
    },
    paymentMethod: {
        type: String
    },
    rawResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to quickly check if a user has unlocked a match
PurchaseSchema.index({ userId: 1, matchId: 1, status: 1 });

module.exports = mongoose.model('Purchase', PurchaseSchema);
