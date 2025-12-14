const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Seed Super Admin (Optional, or handled via registration if not exists, but better to ensure)
// For simplicity, we'll suggest a seed script or just handle it here if manual registration is expected or just "magic" login.
// Given the prompt gives specific credentials, I'll make sure registration handles them or I create a seed.
// Let's rely on standard registration but allow the specific email to be auto-approved or pre-seeded.
// Actually, I'll create a seed function that runs on server start, but for now let's build the controller.

exports.register = async (req, res) => {
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

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        if (!user.isApproved) return res.status(403).json({ msg: 'Account not approved yet' });

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

exports.getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ isApproved: false, role: 'user' });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.approveUser = async (req, res) => {
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
