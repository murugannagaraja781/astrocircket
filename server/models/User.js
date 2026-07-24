const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'superadmin'],
        default: 'user'
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
});

// Add index for faster role-based lookups
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);
