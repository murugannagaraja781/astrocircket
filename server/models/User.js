const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    googleId: {
        type: String,
        sparse: true
    },
    email: {
        type: String,
        sparse: true
    },
    displayName: {
        type: String
    },
    avatar: {
        type: String
    },
    fcmTokens: [{
        type: String
    }],
    role: {
        type: String,
        enum: ['user', 'superadmin'],
        default: 'user'
    },
    isApproved: {
        type: Boolean,
        default: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Add index for faster role-based lookups
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);
