const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: [true, 'Transaction type is required']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    receipt: {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        path: String
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'digital_wallet', 'check', 'other'],
        default: 'other'
    },
    location: {
        type: String,
        trim: true,
        maxlength: [100, 'Location cannot exceed 100 characters']
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [20, 'Tag cannot exceed 20 characters']
    }],
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    extractedFromReceipt: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
    return `$${this.amount.toFixed(2)}`;
});

module.exports = mongoose.model('Transaction', transactionSchema);
