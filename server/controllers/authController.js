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
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

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

module.exports = {
    getAdminStats,
    register,
    login,
    getPendingUsers,
    approveUser,
    getAllUsers,
    deleteUser,
    blockUser,
    incrementView
};
