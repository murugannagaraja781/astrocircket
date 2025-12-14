const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for password reset');

        const username = 'admin@gmail.com';
        let user = await User.findOne({ username });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('12345', salt);

        if (user) {
            user.password = hashedPassword;
            await user.save();
            console.log('Password updated for existing admin.');
        } else {
            user = new User({
                username,
                password: hashedPassword,
                role: 'superadmin',
                isApproved: true
            });
            await user.save();
            console.log('Admin user created with new password.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPassword();
