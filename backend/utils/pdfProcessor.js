const pdfParse = require('pdf-parse');
const fs = require('fs').promises;

// Process PDF and extract text
const processPDFDocument = async (pdfPath) => {
    try {
        const dataBuffer = await fs.readFile(pdfPath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('PDF processing error:', error);
        throw new Error('Failed to process PDF document');
    }
};

// Extract transaction data from bank statement PDF text
const extractTransactionHistory = (pdfText) => {
    const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line);
    const transactions = [];
    
    // Common patterns for transaction data in bank statements
    const transactionPatterns = [
        // Date Amount Description pattern (MM/DD/YYYY)
        /(\d{1,2}\/\d{1,2}\/\d{4})\s+(-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(.+)/,
        // Date Description Amount pattern
        /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)$/,
        // ISO Date format (YYYY-MM-DD)
        /(\d{4}-\d{1,2}-\d{1,2})\s+(-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(.+)/,
        // Tabular format with multiple spaces/tabs
        /(\d{1,2}\/\d{1,2}\/\d{4})\s{2,}(.+?)\s{2,}(-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
        // Date with dashes, description, amount
        /(\d{1,2}-\d{1,2}-\d{4})\s+(.+?)\s+(-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)$/,
        // European date format (DD/MM/YYYY)
        /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/,
        // Amount without $ symbol
        /(\d{1,2}\/\d{1,2}\/\d{4})\s+(-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(.+)/,
        // Tab-separated values
        /(\d{1,2}\/\d{1,2}\/\d{4})\t+(.+?)\t+(-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    ];

    // Date patterns for validation
    const datePatterns = [
        /(\d{1,2}\/\d{1,2}\/\d{4})/,
        /(\d{4}-\d{1,2}-\d{1,2})/,
        /(\d{1,2}-\d{1,2}-\d{4})/
    ];

    for (const line of lines) {
        // Skip header lines and non-transaction lines
        if (line.toLowerCase().includes('date') && line.toLowerCase().includes('amount')) continue;
        if (line.toLowerCase().includes('statement') || line.toLowerCase().includes('balance')) continue;
        if (line.length < 10) continue;

        for (const pattern of transactionPatterns) {
            const match = line.match(pattern);
            if (match) {
                try {
                    let dateStr, amountStr, description;
                    
                    // Handle different pattern structures
                    if (match.length === 4) {
                        // Standard: date, amount/description, description/amount
                        [, dateStr, amountStr, description] = match;
                        
                        // Check if second capture is actually the description (for patterns where description comes before amount)
                        if (isNaN(parseFloat(amountStr.replace(/[$,]/g, '')))) {
                            // Swap if second capture is description
                            [description, amountStr] = [amountStr, description];
                        }
                    } else {
                        continue; // Skip malformed matches
                    }
                    
                    // Parse date
                    let date;
                    try {
                        // Handle different date formats
                        if (dateStr.includes('/')) {
                            const parts = dateStr.split('/');
                            if (parts.length === 3) {
                                // Try MM/DD/YYYY first, then DD/MM/YYYY
                                const [first, second, year] = parts;
                                if (parseInt(first) > 12) {
                                    // DD/MM/YYYY format
                                    date = new Date(year, second - 1, first);
                                } else {
                                    // MM/DD/YYYY format
                                    date = new Date(year, first - 1, second);
                                }
                            }
                        } else if (dateStr.includes('-')) {
                            const parts = dateStr.split('-');
                            if (parts.length === 3) {
                                if (parts[0].length === 4) {
                                    // YYYY-MM-DD format
                                    date = new Date(dateStr);
                                } else {
                                    // MM-DD-YYYY or DD-MM-YYYY format
                                    const [first, second, year] = parts;
                                    if (parseInt(first) > 12) {
                                        // DD-MM-YYYY format
                                        date = new Date(year, second - 1, first);
                                    } else {
                                        // MM-DD-YYYY format
                                        date = new Date(year, first - 1, second);
                                    }
                                }
                            }
                        }
                        
                        // Validate date
                        if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > new Date().getFullYear()) {
                            continue;
                        }
                    } catch (error) {
                        continue; // Skip invalid dates
                    }

                    // Parse amount
                    let amount = parseFloat(amountStr.replace(/[$,]/g, ''));
                    if (isNaN(amount) || amount === 0) continue;

                    // Determine transaction type
                    const isNegative = amountStr.includes('-') || amount < 0;
                    const type = isNegative ? 'expense' : 'income';
                    amount = Math.abs(amount);

                    // Clean up description
                    const cleanDescription = description
                        .replace(/\s+/g, ' ')
                        .replace(/[^\w\s-.,]/g, '')
                        .trim();

                    if (cleanDescription.length < 3) continue;

                    // Suggest category based on description
                    const suggestedCategory = suggestCategoryFromDescription(cleanDescription);

                    transactions.push({
                        date: date,
                        amount: amount,
                        description: cleanDescription,
                        type: type,
                        suggestedCategory: suggestedCategory,
                        rawLine: line,
                        confidence: 'medium'
                    });

                    break; // Found a match, move to next line
                } catch (error) {
                    continue; // Skip problematic lines
                }
            }
        }
    }

    // Sort transactions by date
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
        totalTransactions: transactions.length,
        transactions: transactions,
        dateRange: transactions.length > 0 ? {
            start: transactions[0].date,
            end: transactions[transactions.length - 1].date
        } : null,
        rawText: pdfText
    };
};

// Suggest category based on transaction description
const suggestCategoryFromDescription = (description) => {
    const desc = description.toLowerCase();
    
    // Define category mapping patterns
    const categoryPatterns = {
        'Food & Dining': [
            'restaurant', 'cafe', 'pizza', 'burger', 'starbucks', 'mcdonald', 'subway',
            'food', 'dining', 'bakery', 'diner', 'kitchen', 'grill', 'bistro'
        ],
        'Transportation': [
            'gas', 'fuel', 'uber', 'lyft', 'taxi', 'metro', 'bus', 'train',
            'shell', 'exxon', 'bp', 'chevron', 'parking', 'toll'
        ],
        'Shopping': [
            'amazon', 'target', 'walmart', 'costco', 'store', 'shop', 'retail',
            'purchase', 'buy', 'mall', 'market'
        ],
        'Bills & Utilities': [
            'electric', 'water', 'gas bill', 'internet', 'phone', 'cable',
            'utility', 'bill', 'payment', 'service'
        ],
        'Healthcare': [
            'doctor', 'hospital', 'medical', 'pharmacy', 'health', 'dental',
            'cvs', 'walgreens', 'clinic', 'medicine'
        ],
        'Entertainment': [
            'movie', 'theater', 'netflix', 'spotify', 'game', 'entertainment',
            'concert', 'show', 'ticket'
        ]
    };

    // Check each category for matching patterns
    for (const [category, patterns] of Object.entries(categoryPatterns)) {
        if (patterns.some(pattern => desc.includes(pattern))) {
            return category;
        }
    }

    return 'Other';
};

// Validate and clean extracted transactions
const validateTransactions = (transactions) => {
    return transactions.filter(transaction => {
        // Basic validation
        if (!transaction.amount || transaction.amount <= 0) return false;
        if (!transaction.description || transaction.description.length < 3) return false;
        if (!transaction.date || isNaN(transaction.date.getTime())) return false;
        
        // Date range validation (last 10 years)
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        if (transaction.date < tenYearsAgo || transaction.date > new Date()) return false;
        
        // Amount validation (reasonable range)
        if (transaction.amount > 1000000) return false; // $1M limit
        
        return true;
    });
};

// Generate summary statistics for extracted transactions
const generateSummary = (transactions) => {
    const summary = {
        totalTransactions: transactions.length,
        totalIncome: 0,
        totalExpenses: 0,
        incomeCount: 0,
        expenseCount: 0,
        dateRange: null,
        categoryBreakdown: {}
    };

    if (transactions.length === 0) return summary;

    // Calculate totals and counts
    for (const transaction of transactions) {
        if (transaction.type === 'income') {
            summary.totalIncome += transaction.amount;
            summary.incomeCount++;
        } else {
            summary.totalExpenses += transaction.amount;
            summary.expenseCount++;
        }

        // Category breakdown
        const category = transaction.suggestedCategory || 'Other';
        if (!summary.categoryBreakdown[category]) {
            summary.categoryBreakdown[category] = { total: 0, count: 0 };
        }
        summary.categoryBreakdown[category].total += transaction.amount;
        summary.categoryBreakdown[category].count++;
    }

    // Date range
    const sortedByDate = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    summary.dateRange = {
        start: sortedByDate[0].date,
        end: sortedByDate[sortedByDate.length - 1].date
    };

    summary.netBalance = summary.totalIncome - summary.totalExpenses;

    return summary;
};

module.exports = {
    processPDFDocument,
    extractTransactionHistory,
    suggestCategoryFromDescription,
    validateTransactions,
    generateSummary
};
