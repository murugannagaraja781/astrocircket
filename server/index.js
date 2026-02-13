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
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('API is running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/players', require('./routes/players'));
app.use('/api/groups', groupRoutes);
app.use('/api/prediction', require('./routes/prediction'));
app.use('/api/user-predictions', require('./routes/userPredictions'));
app.use('/api/leagues', require('./routes/leagues'));

// Serve Static Assets (Frontend)
const possibleBuildPaths = [
    path.join(__dirname, '../client/dist'),
    path.join(process.cwd(), 'client/dist'),
    path.join(process.cwd(), 'dist'),
    path.join(__dirname, 'client/dist')
];

let clientBuildPath = null;
for (const p of possibleBuildPaths) {
    if (fs.existsSync(p)) {
        clientBuildPath = p;
        break;
    }
}

if (clientBuildPath) {
    console.log('Serving frontend from:', clientBuildPath);
    app.use(express.static(clientBuildPath));
    app.get(/.*/, (req, res) => {
        if (req.url.startsWith('/api/')) return res.status(404).json({ msg: 'API route not found' });
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
} else {
    console.warn('Frontend build not found. Attempted paths:');
    possibleBuildPaths.forEach(p => console.warn(` - ${p}`));
    console.warn('Current __dirname:', __dirname);
    console.warn('Current process.cwd():', process.cwd());
}

// Global Error Handler (MUST be after routes)
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Database Connection
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState >= 1) return;

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Don't exit immediately, let the health check reflect the status if needed
    }
};

connectDB();

if (require.main === module) {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT} (bound to 0.0.0.0)`);
    });

    // Handle process termination gracefully
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
            mongoose.connection.close(false, () => {
                console.log('MongoDB connection closed');
                process.exit(0);
            });
        });
    });
}

module.exports = app;

