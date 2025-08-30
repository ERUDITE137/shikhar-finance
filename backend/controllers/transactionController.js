const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// @desc    Get all transactions with pagination and filtering
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, type, category, startDate, endDate, search } = req.query;
        
        // Build query
        const query = { user: mongoose.Types.ObjectId.createFromHexString(req.user.id) };
        
        if (type) query.type = type;
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Date range filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Execute query with pagination
        const transactions = await Transaction.find(query)
            .populate('category', 'name icon color')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get total count for pagination
        const total = await Transaction.countDocuments(query);
        
        // Calculate summary statistics using the same query as transactions
        const summaryQuery = { ...query };
        
        const summary = await Transaction.aggregate([
            { $match: summaryQuery },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);


       

        const summaryData = {
            totalIncome: summary.find(s => s._id === 'income')?.total || 0,
            totalExpense: summary.find(s => s._id === 'expense')?.total || 0,
            incomeCount: summary.find(s => s._id === 'income')?.count || 0,
            expenseCount: summary.find(s => s._id === 'expense')?.count || 0
        };
        summaryData.balance = summaryData.totalIncome - summaryData.totalExpense;

        res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalTransactions: total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                },
                summary: summaryData
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res, next) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: mongoose.Types.ObjectId.createFromHexString(req.user.id)
        }).populate('category', 'name icon color');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
    try {
        const { amount, description, type, category, date, paymentMethod, location, tags, notes } = req.body;

        // Verify category belongs to user
        const categoryDoc = await Category.findOne({ _id: category, user: mongoose.Types.ObjectId.createFromHexString(req.user.id) });
        if (!categoryDoc) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Check if category type matches transaction type
        if (categoryDoc.type !== 'both' && categoryDoc.type !== type) {
            return res.status(400).json({
                success: false,
                message: `Category "${categoryDoc.name}" cannot be used for ${type} transactions`
            });
        }

        const transaction = await Transaction.create({
            amount,
            description,
            type,
            category,
            user: mongoose.Types.ObjectId.createFromHexString(req.user.id),
            date: date || new Date(),
            paymentMethod,
            location,
            tags,
            notes
        });

        // Populate category info
        await transaction.populate('category', 'name icon color');

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: transaction
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
    try {
        let transaction = await Transaction.findOne({
            _id: req.params.id,
            user: mongoose.Types.ObjectId.createFromHexString(req.user.id)
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // If category is being updated, verify it belongs to user
        if (req.body.category) {
            const categoryDoc = await Category.findOne({ 
                _id: req.body.category, 
                user: mongoose.Types.ObjectId.createFromHexString(req.user.id)
            });
            if (!categoryDoc) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category'
                });
            }

            // Check if category type matches transaction type
            const transactionType = req.body.type || transaction.type;
            if (categoryDoc.type !== 'both' && categoryDoc.type !== transactionType) {
                return res.status(400).json({
                    success: false,
                    message: `Category "${categoryDoc.name}" cannot be used for ${transactionType} transactions`
                });
            }
        }

        transaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('category', 'name icon color');

        res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            data: transaction
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: mongoose.Types.ObjectId.createFromHexString(req.user.id)
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        await Transaction.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get transaction analytics
// @route   GET /api/transactions/analytics
// @access  Private
const getAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate, type } = req.query;
        
        // Build base query
        const matchQuery = { user: mongoose.Types.ObjectId.createFromHexString(req.user.id) };
        if (type) matchQuery.type = type;
        if (startDate || endDate) {
            matchQuery.date = {};
            if (startDate) matchQuery.date.$gte = new Date(startDate);
            if (endDate) matchQuery.date.$lte = new Date(endDate);
        }

        console.log('Analytics query:', matchQuery);
        console.log('Analytics params:', { startDate, endDate, type });

        // Get expenses by category
        const expensesByCategory = await Transaction.aggregate([
            { $match: { ...matchQuery, type: 'expense' } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: '$categoryInfo' },
            {
                $group: {
                    _id: '$category',
                    name: { $first: '$categoryInfo.name' },
                    icon: { $first: '$categoryInfo.icon' },
                    color: { $first: '$categoryInfo.color' },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Get income by category
        const incomeByCategory = await Transaction.aggregate([
            { $match: { ...matchQuery, type: 'income' } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: '$categoryInfo' },
            {
                $group: {
                    _id: '$category',
                    name: { $first: '$categoryInfo.name' },
                    icon: { $first: '$categoryInfo.icon' },
                    color: { $first: '$categoryInfo.color' },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Get monthly trends
        const monthlyTrends = await Transaction.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        type: '$type'
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Get daily spending for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const dailySpending = await Transaction.aggregate([
            { 
                $match: { 
                    ...matchQuery, 
                    date: { $gte: thirtyDaysAgo },
                    type: 'expense'
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                expensesByCategory,
                incomeByCategory,
                monthlyTrends,
                dailySpending
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getAnalytics
};
