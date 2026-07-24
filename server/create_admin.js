const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGO_URI);
        // Set a short timeout for connection to fail fast if unreachable
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB Connected');

        const email = 'admin1@gmail.com';
        const password = '12345';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let user = await User.findOne({ username: email });

        if (user) {
            console.log('Admin user already exists');
            user.password = hashedPassword;
            user.role = 'superadmin';
            user.isApproved = true;
            await user.save();
            console.log('Admin password updated to:', password);
        } else {
            user = new User({
                username: email,
                password: hashedPassword,
                role: 'superadmin',
                isApproved: true,
                isBlocked: false
            });
            await user.save();
            console.log('Admin user created successfully');
            console.log('Email:', email);
            console.log('Password:', password);
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

createAdmin();
