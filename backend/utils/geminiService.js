// Simple Gemini service for parsing OCR text
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Parse OCR text with Gemini
const parseReceiptText = async (ocrText) => {
    try {
        const prompt = `Parse this receipt/invoice text and extract ONLY these 4 fields. Return ONLY valid JSON, no other text:

${ocrText}

Extract and return ONLY this JSON format:
{
  "merchant": "store/company name",
  "amount": 0.00,
  "date": "YYYY-MM-DD",
  "category": "food/shopping/electronics/etc"
}

Rules:
- amount should be the total/final amount as a number
- date should be in YYYY-MM-DD format
- category should be one word like: food, shopping, electronics, grocery, gas, entertainment
- Return ONLY the JSON object, no explanation`;

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;
        
        console.log('Gemini raw response:', text);
        
        // Find JSON in response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            
            // Extract only the fields we want
            return {
                merchant: parsedData.merchant || null,
                amount: parseFloat(parsedData.amount || parsedData.total_amount) || null,
                date: parsedData.date || parsedData.invoice_date || parsedData.order_date || null,
                category: parsedData.category || 'shopping'
            };
        }
        
        return null;
    } catch (error) {
        console.error('Gemini error:', error);
        return null;
    }
};

// Parse transaction history text with Gemini
const parseTransactionHistory = async (pdfText) => {
    try {
        const prompt = `Parse this bank statement/transaction history text and extract ALL transactions. Return ONLY valid JSON array, no other text:

${pdfText}

Extract and return ONLY this JSON format:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "amount": 0.00,
      "description": "transaction description",
      "type": "income" or "expense",
      "category": "category name"
    }
  ]
}

Rules:
- Extract ALL transactions from the text
- amount should be positive numbers only
- type should be "income" for deposits/credits, "expense" for debits/withdrawals
- date should be in YYYY-MM-DD format
- description should be cleaned up merchant/transaction description
- category should be one of: food, shopping, transportation, utilities, healthcare, entertainment, income, transfer, other
- Skip header lines, totals, balances, and non-transaction lines
- Return ONLY the JSON object, no explanation
- If no transactions found, return {"transactions": []}`;

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;
        
        console.log('Gemini transaction history response:', text);
        
        // Find JSON in response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            
            if (parsedData.transactions && Array.isArray(parsedData.transactions)) {
                // Clean and validate each transaction
                const cleanTransactions = parsedData.transactions
                    .filter(txn => txn.amount && txn.date && txn.description)
                    .map(txn => ({
                        date: new Date(txn.date),
                        amount: Math.abs(parseFloat(txn.amount)),
                        description: txn.description.trim(),
                        type: txn.type === 'income' ? 'income' : 'expense',
                        suggestedCategory: txn.category || 'other',
                        confidence: 'high',
                        source: 'gemini'
                    }))
                    .filter(txn => !isNaN(txn.date.getTime()) && txn.amount > 0);

                return {
                    transactions: cleanTransactions,
                    totalTransactions: cleanTransactions.length,
                    source: 'gemini'
                };
            }
        }
        
        return null;
    } catch (error) {
        console.error('Gemini transaction history error:', error);
        return null;
    }
};

// Enhanced transaction parsing that combines regex and Gemini
const parseTransactionHistoryEnhanced = async (pdfText) => {
    try {
        // First try Gemini for better accuracy
        const geminiResult = await parseTransactionHistory(pdfText);
        
        if (geminiResult && geminiResult.transactions.length > 0) {
            console.log(`Gemini extracted ${geminiResult.transactions.length} transactions`);
            return geminiResult;
        }
        
        // Fallback to regex patterns if Gemini fails
        console.log('Gemini failed, falling back to regex patterns');
        const { extractTransactionHistory } = require('./pdfProcessor');
        return extractTransactionHistory(pdfText);
        
    } catch (error) {
        console.error('Enhanced parsing error:', error);
        // Final fallback to regex
        const { extractTransactionHistory } = require('./pdfProcessor');
        return extractTransactionHistory(pdfText);
    }
};

module.exports = {
    parseReceiptText,
    parseTransactionHistory,
    parseTransactionHistoryEnhanced
};
