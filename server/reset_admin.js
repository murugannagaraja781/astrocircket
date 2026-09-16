const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const resetAdmin = async () => {
    try {
        const args = process.argv.slice(2);
        const newUsername = args[0] || 'admin@gmail.com';
        const newPassword = args[1] || '123456';

        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI is missing in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Check if a superadmin already exists
        let user = await User.findOne({ role: 'superadmin' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        if (user) {
            user.username = newUsername;
            user.password = hashedPassword;
            user.role = 'superadmin';
            user.isApproved = true;
            user.isBlocked = false;
            await user.save();
            console.log(`\n🎉 Admin credentials updated successfully!`);
            console.log(`👤 Username: ${newUsername}`);
            console.log(`🔑 Password: ${newPassword}\n`);
        } else {
            user = new User({
                username: newUsername,
                password: hashedPassword,
                role: 'superadmin',
                isApproved: true,
                isBlocked: false
            });
            await user.save();
            console.log(`\n🎉 New Admin created successfully!`);
            console.log(`👤 Username: ${newUsername}`);
            console.log(`🔑 Password: ${newPassword}\n`);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error resetting admin:', err.message);
        process.exit(1);
    }
};

resetAdmin();
