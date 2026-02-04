const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const chartRoutes = require('./routes/charts');
const groupRoutes = require('./routes/groups'); // Import it!

const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS Configuration - Fixed for production
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // Allow all origins
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    exposedHeaders: ['x-auth-token'],
    optionsSuccessStatus: 200
};

// Apply CORS middleware (handles preflight automatically)
app.use(cors(corsOptions));

app.use(express.json());

// Serve static uploads (Only if directory exists, to avoid Vercel crashes)
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadDir)) {
    app.use('/uploads', express.static(uploadDir));
}

// Health check route (before auth)
app.get('/', (req, res) => {
    res.send('API is running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/players', require('./routes/players'));
app.use('/api/groups', groupRoutes);
app.use('/api/prediction', require('./routes/prediction'));

// Serve Static Assets (Frontend)
const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get('(.*)', (req, res) => {
        if (req.url.startsWith('/api/')) return res.status(404).json({ msg: 'API route not found' });
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// Global Error Handler (MUST be after routes)
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Database Connection
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

connectDB();

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;

