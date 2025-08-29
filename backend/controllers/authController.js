const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', {
        expiresIn: '30d'
    });
};

// Create default categories for new user
const createDefaultCategories = async (userId) => {
    const defaultCategories = [
        { name: 'Food & Dining', icon: '🍽️', color: '#ef4444', type: 'expense', user: userId, isDefault: true },
        { name: 'Transportation', icon: '🚗', color: '#f97316', type: 'expense', user: userId, isDefault: true },
        { name: 'Shopping', icon: '🛒', color: '#eab308', type: 'expense', user: userId, isDefault: true },
        { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense', user: userId, isDefault: true },
        { name: 'Bills & Utilities', icon: '💡', color: '#06b6d4', type: 'expense', user: userId, isDefault: true },
        { name: 'Healthcare', icon: '🏥', color: '#10b981', type: 'expense', user: userId, isDefault: true },
        { name: 'Salary', icon: '💰', color: '#22c55e', type: 'income', user: userId, isDefault: true },
        { name: 'Investment', icon: '📈', color: '#3b82f6', type: 'income', user: userId, isDefault: true },
        { name: 'Other', icon: '📁', color: '#6b7280', type: 'both', user: userId, isDefault: true }
    ];

    try {
        await Category.insertMany(defaultCategories);
    } catch (error) {
        console.error('Error creating default categories:', error);
    }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({ name, email, password });

        // Create default categories for the user
        await createDefaultCategories(user._id);

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe
};
