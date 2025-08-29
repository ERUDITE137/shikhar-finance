require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config/config');
const connectDB = require('./config/database');

// Route imports
const authRoutes = require('./routes/auth');

const app = express();

// Connect to database
connectDB();


// CORS
app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded receipts)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ message: 'API is running' });
});

// API routes
app.use('/api/auth', authRoutes);


// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});

module.exports = app;
