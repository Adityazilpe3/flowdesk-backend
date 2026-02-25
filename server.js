const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        const allowed = [
            process.env.CLIENT_URL,
            'http://localhost:5173',
            'http://localhost:3000',
        ].filter(Boolean);

        // Allow any vercel.app domain automatically
        if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/org', require('./routes/org'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Self-ping every 10 minutes to keep Render free tier awake
    if (process.env.NODE_ENV === 'production') {
        const SELF_URL = process.env.RENDER_EXTERNAL_URL || `https://flowdesk-backend-ehvh.onrender.com`;
        setInterval(async () => {
            try {
                const https = require('https');
                https.get(`${SELF_URL}/api/health`, (res) => {
                    console.log(`[keepalive] ping → ${res.statusCode}`);
                }).on('error', () => { });
            } catch (_) { }
        }, 10 * 60 * 1000); // every 10 minutes
    }
});

