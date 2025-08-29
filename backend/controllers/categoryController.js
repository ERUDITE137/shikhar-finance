const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
    try {
        const { type } = req.query;
        
        const query = { user: req.user.id };
        if (type && type !== 'all') {
            query.$or = [
                { type: type },
                { type: 'both' }
            ];
        }

        const categories = await Category.find(query).sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
const getCategory = async (req, res, next) => {
    try {
        const category = await Category.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
    try {
        const { name, icon, color, type } = req.body;

        const category = await Category.create({
            name,
            icon,
            color,
            type,
            user: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
    try {
        let category = await Category.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Don't allow updating default categories' type
        if (category.isDefault && req.body.type && req.body.type !== category.type) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change type of default categories'
            });
        }

        category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Don't allow deleting default categories
        if (category.isDefault) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete default categories'
            });
        }

        // Check if category has associated transactions
        const transactionCount = await Transaction.countDocuments({ category: req.params.id });
        if (transactionCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It has ${transactionCount} associated transactions.`
            });
        }

        await Category.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};
