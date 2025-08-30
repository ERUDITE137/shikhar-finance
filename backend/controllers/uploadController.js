const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { parseReceiptText, parseTransactionHistoryEnhanced } = require('../utils/geminiService');
const { processReceiptImage, extractReceiptData, generateDescription, suggestCategory } = require('../utils/receiptProcessor');
const { processPDFDocument, extractTransactionHistory, validateTransactions, generateSummary } = require('../utils/pdfProcessor');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only image files and PDFs are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// @desc    Upload and process receipt
// @route   POST /api/upload/receipt
// @access  Private
const uploadReceipt = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const filePath = req.file.path;
        let extractedData = null;
        let error = null;

        try {
            // Process the uploaded file
            if (req.file.mimetype.startsWith('image/')) {
                // Step 1: Extract text with OCR
                const ocrText = await processReceiptImage(filePath);

                console.log('OCR text:', ocrText);
                
                // Step 2: Parse with Gemini
                const geminiData = await parseReceiptText(ocrText);

                console.log('Gemini data:', geminiData);
                // Step 3: Combine results
                extractedData = extractReceiptData(ocrText);
                if (geminiData) {
                    extractedData.merchant = geminiData.merchant || extractedData.merchant;
                    extractedData.amount = geminiData.amount || extractedData.amount;
                    extractedData.date = geminiData.date ? new Date(geminiData.date) : extractedData.date;
                    extractedData.category = geminiData.category;
                }
            } else if (req.file.mimetype === 'application/pdf') {
                // Step 1: Extract text from PDF
                const pdfText = await processPDFDocument(filePath);
                
                console.log('PDF text:', pdfText);
                
                // Step 2: Parse with Gemini
                const geminiData = await parseReceiptText(pdfText);
                
                console.log('Gemini data:', geminiData);
                
                // Step 3: Combine results
                const transactionHistory = extractTransactionHistory(pdfText);
                
                extractedData = {
                    merchant: geminiData?.merchant || null,
                    amount: geminiData?.amount || null,
                    date: geminiData?.date ? new Date(geminiData.date) : null,
                    category: geminiData?.category || null,
                    items: [],
                    rawText: pdfText,
                    isPDF: true,
                    isTransactionHistory: transactionHistory.transactions.length > 1,
                    transactionHistory: transactionHistory
                };
            }
        } catch (processingError) {
            console.error('Receipt processing error:', processingError);
            error = 'Failed to process receipt. Please try again or enter details manually.';
            
            // Still keep the file for manual review
            extractedData = {
                merchant: null,
                amount: null,
                date: null,
                items: [],
                rawText: '',
                processingError: true
            };
        }

        // Generate suggested description
        const description = generateDescription(extractedData);
        
        // Find matching category
        let suggestedCategory = null;
        const userCategories = await Category.find({ user: req.user.id });
        
        // Try Gemini category first
        if (extractedData.category) {
            suggestedCategory = userCategories.find(cat => 
                cat.name.toLowerCase().includes(extractedData.category.toLowerCase())
            );
        }
        
        // Fallback to original method
        if (!suggestedCategory) {
            const categoryHint = suggestCategory(extractedData);
            if (categoryHint) {
                suggestedCategory = userCategories.find(cat => 
                    cat.name.toLowerCase().includes(categoryHint)
                );
            }
        }

        // If auto-creation is requested and we have enough data
        if (req.body.autoCreate === 'true' && extractedData.amount && extractedData.amount > 0) {
            try {
                // Use suggested category or default to 'Other'
                let categoryId = suggestedCategory?._id;
                if (!categoryId) {
                    const otherCategory = await Category.findOne({ 
                        user: req.user.id, 
                        name: 'Other' 
                    });
                    categoryId = otherCategory?._id;
                }

                if (categoryId) {
                    const transaction = await Transaction.create({
                        amount: extractedData.amount,
                        description: description,
                        type: 'expense',
                        category: categoryId,
                        user: req.user.id,
                        date: extractedData.date || new Date(),
                        receipt: {
                            filename: req.file.filename,
                            originalName: req.file.originalname,
                            mimetype: req.file.mimetype,
                            size: req.file.size,
                            path: req.file.path
                        },
                        extractedFromReceipt: true
                    });

                    await transaction.populate('category', 'name icon color');

                    return res.status(201).json({
                        success: true,
                        message: 'Receipt processed and transaction created successfully',
                        data: {
                            transaction,
                            extractedData,
                            processingError: error
                        }
                    });
                }
            } catch (transactionError) {
                console.error('Transaction creation error:', transactionError);
            }
        }

        // Return extracted data for manual review/editing
        res.status(200).json({
            success: true,
            message: 'Receipt uploaded and processed successfully',
            data: {
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size
                },
                extractedData,
                suggestedTransaction: {
                    amount: extractedData.amount,
                    description: description,
                    type: 'expense',
                    category: suggestedCategory,
                    date: extractedData.date || new Date()
                },
                processingError: error
            }
        });

    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error cleaning up file:', unlinkError);
            }
        }
        next(error);
    }
};

// @desc    Create transaction from processed receipt
// @route   POST /api/upload/create-transaction
// @access  Private
const createTransactionFromReceipt = async (req, res, next) => {
    try {
        const { amount, description, type, category, date, filename, suggestedCategory } = req.body;

        // Verify the file exists
        const filePath = path.join('uploads', filename);
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Receipt file not found'
            });
        }

        // Find or create category
        let categoryId = category;
        
        if (!categoryId && suggestedCategory) {
            // Try to find existing category
            let existingCategory = await Category.findOne({ 
                user: mongoose.Types.ObjectId.createFromHexString(req.user.id),
                name: { $regex: new RegExp(suggestedCategory, 'i') }
            });
            
            if (!existingCategory) {
                // Create new category
                const categoryColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
                const categoryIcons = ['🛒', '🍔', '⛽', '🎬', '💊', '🏠', '📱', '✈️'];
                
                existingCategory = await Category.create({
                    name: suggestedCategory.charAt(0).toUpperCase() + suggestedCategory.slice(1),
                    icon: categoryIcons[Math.floor(Math.random() * categoryIcons.length)],
                    color: categoryColors[Math.floor(Math.random() * categoryColors.length)],
                    type: 'expense',
                    user: mongoose.Types.ObjectId.createFromHexString(req.user.id)
                });
                
                console.log('Created new category:', existingCategory);
            }
            
            categoryId = existingCategory._id;
        }
        
        // Default to 'Other' category if still no category
        if (!categoryId) {
            let otherCategory = await Category.findOne({ 
                user: mongoose.Types.ObjectId.createFromHexString(req.user.id),
                name: 'Other'
            });
            
            if (!otherCategory) {
                otherCategory = await Category.create({
                    name: 'Other',
                    icon: '📁',
                    color: '#6b7280',
                    type: 'both',
                    user: mongoose.Types.ObjectId.createFromHexString(req.user.id)
                });
            }
            
            categoryId = otherCategory._id;
        }

        // Get file stats
        const stats = await fs.stat(filePath);

        const transaction = await Transaction.create({
            amount,
            description,
            type: type || 'expense',
            category: categoryId,
            user: mongoose.Types.ObjectId.createFromHexString(req.user.id),
            date: date || new Date(),
            receipt: {
                filename: filename,
                originalName: filename,
                mimetype: 'image/jpeg', // Default - could be enhanced
                size: stats.size,
                path: filePath
            },
            extractedFromReceipt: true
        });

        await transaction.populate('category', 'name icon color');

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully from receipt',
            data: transaction
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Upload and process PDF transaction history
// @route   POST /api/upload/transaction-history
// @access  Private
const uploadTransactionHistory = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No PDF file uploaded'
            });
        }

        if (req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({
                success: false,
                message: 'Only PDF files are supported for transaction history'
            });
        }

        const filePath = req.file.path;
        let extractedData = null;
        let error = null;

        try {
            // Process PDF and extract transaction history
            const pdfText = await processPDFDocument(filePath);
            console.log('PDF text extracted, length:', pdfText.length);
            
            // Use enhanced parsing with Gemini + regex fallback
            const transactionHistory = await parseTransactionHistoryEnhanced(pdfText);
            
            // Validate extracted transactions
            const validTransactions = validateTransactions(transactionHistory.transactions);
            
            // Generate summary
            const summary = generateSummary(validTransactions);
            
            extractedData = {
                ...transactionHistory,
                transactions: validTransactions,
                summary: summary,
                validationResults: {
                    totalExtracted: transactionHistory.transactions.length,
                    validTransactions: validTransactions.length,
                    rejectedTransactions: transactionHistory.transactions.length - validTransactions.length
                },
                processingMethod: transactionHistory.source || 'regex',
                rawText: pdfText
            };

        } catch (processingError) {
            console.error('PDF processing error:', processingError);
            error = 'Failed to process PDF. Please ensure it contains a valid transaction history in tabular format.';
            
            extractedData = {
                transactions: [],
                summary: null,
                rawText: '',
                processingError: true
            };
        }

        res.status(200).json({
            success: true,
            message: 'PDF processed successfully',
            data: {
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size
                },
                extractedData,
                processingError: error
            }
        });

    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error cleaning up file:', unlinkError);
            }
        }
        next(error);
    }
};

// @desc    Bulk create transactions from PDF history
// @route   POST /api/upload/bulk-create-transactions
// @access  Private
const bulkCreateTransactions = async (req, res, next) => {
    try {
        const { transactions, filename } = req.body;

        if (!transactions || !Array.isArray(transactions)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transactions data'
            });
        }

        // Get user's categories for mapping
        const userCategories = await Category.find({ user: req.user.id });
        const categoryMap = new Map();
        userCategories.forEach(cat => {
            categoryMap.set(cat.name.toLowerCase(), cat._id);
        });

        const createdTransactions = [];
        const errors = [];

        for (let i = 0; i < transactions.length; i++) {
            const txn = transactions[i];
            
            try {
                // Find matching category or use 'Other'
                let categoryId = null;
                if (txn.category) {
                    categoryId = categoryMap.get(txn.category.toLowerCase());
                }
                
                if (!categoryId) {
                    // Try to find by suggested category
                    if (txn.suggestedCategory) {
                        categoryId = categoryMap.get(txn.suggestedCategory.toLowerCase());
                    }
                }
                
                if (!categoryId) {
                    // Default to 'Other' category
                    const otherCategory = userCategories.find(cat => cat.name === 'Other');
                    categoryId = otherCategory?._id;
                }

                if (!categoryId) {
                    errors.push({
                        index: i,
                        transaction: txn,
                        error: 'No valid category found'
                    });
                    continue;
                }

                const transaction = await Transaction.create({
                    amount: txn.amount,
                    description: txn.description,
                    type: txn.type,
                    category: categoryId,
                    user: req.user.id,
                    date: new Date(txn.date),
                    extractedFromReceipt: true,
                    notes: `Imported from PDF: ${filename || 'transaction-history.pdf'}`
                });

                await transaction.populate('category', 'name icon color');
                createdTransactions.push(transaction);

            } catch (error) {
                console.error('Error creating transaction:', error);
                errors.push({
                    index: i,
                    transaction: txn,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Successfully created ${createdTransactions.length} transactions`,
            data: {
                createdTransactions,
                summary: {
                    total: transactions.length,
                    created: createdTransactions.length,
                    failed: errors.length
                },
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    upload: upload.single('receipt'),
    uploadReceipt,
    createTransactionFromReceipt,
    uploadTransactionHistory,
    bulkCreateTransactions
};
