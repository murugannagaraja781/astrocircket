const User = require('../models/User');
const Player = require('../models/Player');
const Group = require('../models/Group'); // Import Group model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const GlobalStat = require('../models/GlobalStat');


// Seed Super Admin (Optional, or handled via registration if not exists, but better to ensure)
// For simplicity, we'll suggest a seed script or just handle it here if manual registration is expected or just "magic" login.
// Given the prompt gives specific credentials, I'll make sure registration handles them or I create a seed.
// Let's rely on standard registration but allow the specific email to be auto-approved or pre-seeded.
// Actually, I'll create a seed function that runs on server start, but for now let's build the controller.

// Get Admin Stats
const getAdminStats = async (req, res) => {
    let totalUsers = "Err";
    let pendingUsers = "Err";
    let totalPlayers = "Err";
    let totalGroups = "Err";

    try {
        console.log('Fetching Admin Stats...');
        try { totalUsers = await User.countDocuments(); } catch (e) { console.error("User Count Failed", e); totalUsers = -1; }
        try { pendingUsers = await User.countDocuments({ isApproved: false }); } catch (e) { console.error("Pending Count Failed", e); pendingUsers = -1; }

        try {
            // Debug Player Model
            console.log('Player Model Details:', Player ? 'Loaded' : 'Undefined');
            totalPlayers = await Player.countDocuments();
        } catch (e) {
            console.error("Player Count Failed", e);
            totalPlayers = -2; // -2 Indicate Player Error
        }

        try { totalGroups = await Group.countDocuments(); } catch (e) { console.error("Group Count Failed", e); totalGroups = -1; }

        let totalViews = 0;
        try {
            const viewStat = await GlobalStat.findOne({ key: 'dashboard_views' });
            totalViews = viewStat ? viewStat.value : 0;
        } catch (e) { console.error("View Count Failed", e); }

        console.log('Stats:', { totalUsers, pendingUsers, totalPlayers, totalGroups, totalViews });

        res.json({
            totalUsers,
            pendingUsers,
            totalPlayers,
            totalGroups,
            totalViews
        });
    } catch (err) {
        console.error('Error in getAdminStats (Global):', err);
        // Even if global fail, send what we have?
        // If we are here, something major failed (like definitions).
        res.status(500).json({
            message: 'Server Error',
            details: err.message,
            stack: err.stack
        });
    }
};

// Register
const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // Check if it's the super admin email
        const isSuperAdmin = username === 'admin@gmail.com';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username,
            password: hashedPassword,
            role: isSuperAdmin ? 'superadmin' : 'user',
            isApproved: isSuperAdmin // Super admin is auto-approved
        });

        await user.save();

        res.status(201).json({ msg: 'User registered. Please wait for approval if you are not an admin.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Login
const login = async (req, res) => {
    try {
        console.log('Login Request Received:', req.body.username); // DEBUG
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            console.log('Login Failed: User not found', username); // DEBUG
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Login Failed: Password mismatch', username); // DEBUG
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (!user.isApproved) return res.status(403).json({ msg: 'Account not approved yet' });
        if (user.isBlocked) return res.status(403).json({ msg: 'Account is blocked' });

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get Pending Users
const getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ isApproved: false, role: 'user' });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Approve User
const approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.isApproved = true;
        await user.save();
        res.json({ msg: 'User approved' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get All Users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Delete User
const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Block/Unblock User
const blockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.isBlocked = !user.isBlocked; // Toggle
        await user.save();
        res.json({ msg: `User ${user.isBlocked ? 'blocked' : 'unblocked'}` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get logged in user details from MongoDB using token
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Increment Dashboard Views
const incrementView = async (req, res) => {
    try {
        await GlobalStat.findOneAndUpdate(
            { key: 'dashboard_views' },
            { $inc: { value: 1 } },
            { upsert: true, new: true }
        );
        res.status(200).send('Incremented');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Google OAuth Login
const googleLogin = async (req, res) => {
    try {
        const { idToken, email, displayName, photoUrl } = req.body;
        if (!idToken && !email) {
            return res.status(400).json({ msg: 'ID Token or Email is required' });
        }

        const fcmService = require('../utils/fcmService');
        let verifiedEmail = email;
        let verifiedGoogleId = null;
        let verifiedName = displayName;
        let verifiedAvatar = photoUrl;

        // Verify Google token with Firebase Admin
        if (idToken) {
            const verification = await fcmService.verifyGoogleIdToken(idToken);
            if (verification.success && verification.user) {
                verifiedEmail = verification.user.email || verifiedEmail;
                verifiedGoogleId = verification.user.uid;
                verifiedName = verification.user.name || verifiedName;
                verifiedAvatar = verification.user.picture || verifiedAvatar;
            } else {
                console.warn('⚠️ Firebase token verification notice (using client profile):', verification.error);
            }
        }

        if (!verifiedEmail && !verifiedGoogleId) {
            return res.status(400).json({ msg: 'Unable to authenticate Google account' });
        }

        const lookupKey = verifiedEmail || `google_${verifiedGoogleId}`;

        // Find existing user by googleId, email or username
        let user = await User.findOne({
            $or: [
                ...(verifiedGoogleId ? [{ googleId: verifiedGoogleId }] : []),
                ...(verifiedEmail ? [{ email: verifiedEmail }, { username: verifiedEmail }] : []),
                { username: lookupKey }
            ]
        });

        if (!user) {
            // Auto create new Google user
            user = new User({
                username: lookupKey,
                email: verifiedEmail || `${lookupKey}@spastro.app`,
                googleId: verifiedGoogleId,
                displayName: verifiedName || lookupKey.split('@')[0],
                avatar: verifiedAvatar || '',
                role: 'user',
                isApproved: true,
                isBlocked: false
            });
            await user.save();
            console.log('✅ Created new Google user:', user.username);
        } else {
            // Update profile fields if missing
            let updated = false;
            if (verifiedGoogleId && !user.googleId) { user.googleId = verifiedGoogleId; updated = true; }
            if (verifiedEmail && !user.email) { user.email = verifiedEmail; updated = true; }
            if (verifiedName && !user.displayName) { user.displayName = verifiedName; updated = true; }
            if (verifiedAvatar && !user.avatar) { user.avatar = verifiedAvatar; updated = true; }
            if (updated) await user.save();
        }

        if (user.isBlocked) {
            return res.status(403).json({ msg: 'Account is blocked by administrator' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        const jwtSecret = process.env.JWT_SECRET || 'astrocricket_secure_jwt_secret_2025';

        jwt.sign(payload, jwtSecret, { expiresIn: '30d' }, (err, token) => {
            if (err) throw err;
            res.json({
                success: true,
                token,
                role: user.role,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    avatar: user.avatar,
                    role: user.role
                }
            });
        });
    } catch (err) {
        console.error('❌ Error in googleLogin:', err.message);
        res.status(500).json({ msg: 'Server error during Google Login' });
    }
};

// Save Device FCM Token
const saveFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            return res.status(400).json({ msg: 'fcmToken is required' });
        }

        if (req.user && req.user.id) {
            await User.findByIdAndUpdate(req.user.id, {
                $addToSet: { fcmTokens: fcmToken }
            });
        }

        res.json({ success: true, msg: 'FCM Token registered successfully' });
    } catch (err) {
        console.error('❌ Error in saveFcmToken:', err.message);
        res.status(500).json({ msg: 'Server error saving FCM token' });
    }
};

// Create User / Client by Admin
const createUserByAdmin = async (req, res) => {
    try {
        const { username, password, role = 'client', displayName } = req.body;
        if (!username || !password) {
            return res.status(400).json({ msg: 'Username and password are required' });
        }

        let existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists with this username/email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            password: hashedPassword,
            displayName: displayName || username,
            role: ['user', 'superadmin', 'client'].includes(role) ? role : 'client',
            isApproved: true
        });

        await newUser.save();
        res.status(201).json({
            success: true,
            msg: `User (${newUser.role}) created successfully`,
            user: {
                id: newUser._id,
                username: newUser.username,
                role: newUser.role,
                displayName: newUser.displayName
            }
        });
    } catch (err) {
        console.error('❌ Error in createUserByAdmin:', err.message);
        res.status(500).json({ msg: 'Server error creating user' });
    }
};

// Update User Role
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'superadmin', 'client'].includes(role)) {
            return res.status(400).json({ msg: 'Invalid role specified' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.role = role;
        await user.save();
        res.json({ success: true, msg: `User role updated to ${role}`, user });
    } catch (err) {
        console.error('❌ Error in updateUserRole:', err.message);
        res.status(500).json({ msg: 'Server error updating user role' });
    }
};

// Reset User Password by Admin
const resetUserPasswordByAdmin = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ msg: 'Password must be at least 4 characters long' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ success: true, msg: `Password reset successfully for ${user.username}` });
    } catch (err) {
        console.error('❌ Error in resetUserPasswordByAdmin:', err.message);
        res.status(500).json({ msg: 'Server error resetting password' });
    }
};

module.exports = {
    getAdminStats,
    register,
    login,
    googleLogin,
    saveFcmToken,
    getMe,
    getPendingUsers,
    approveUser,
    getAllUsers,
    deleteUser,
    blockUser,
    incrementView,
    createUserByAdmin,
    updateUserRole,
    resetUserPasswordByAdmin
};

