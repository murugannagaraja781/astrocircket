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
    }
});

module.exports = mongoose.model('User', UserSchema);
