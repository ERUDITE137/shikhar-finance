module.exports = {
    PORT: process.env.PORT || 8000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/personal-finance',
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};
