const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Process image and extract text using OCR
const processReceiptImage = async (imagePath) => {
    try {
        // Optimize image for better OCR results
        const optimizedImagePath = path.join(path.dirname(imagePath), 'optimized_' + path.basename(imagePath));
        
        await sharp(imagePath)
            .resize(1200, null, { withoutEnlargement: true })
            .normalize()
            .sharpen()
            .toFile(optimizedImagePath);

        // Perform OCR
        const { data: { text } } = await Tesseract.recognize(optimizedImagePath, 'eng', {
            logger: m => console.log(m)
        });

        // Clean up optimized image
        try {
            await fs.unlink(optimizedImagePath);
        } catch (error) {
            console.log('Warning: Could not clean up optimized image:', error.message);
        }

        return text;
    } catch (error) {
        console.error('OCR processing error:', error);
        throw new Error('Failed to process receipt image');
    }
};

// Extract financial information from OCR text
const extractReceiptData = (ocrText) => {
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line);
    
    const result = {
        merchant: null,
        amount: null,
        date: null,
        items: [],
        possibleAmounts: [],
        rawText: ocrText
    };

    // Common patterns for amounts
    const amountPatterns = [
        /total[:\s]*\$?(\d+\.?\d{0,2})/i,
        /subtotal[:\s]*\$?(\d+\.?\d{0,2})/i,
        /amount[:\s]*\$?(\d+\.?\d{0,2})/i,
        /\$(\d+\.\d{2})/g,
        /(\d+\.\d{2})/g
    ];

    // Date patterns
    const datePatterns = [
        /(\d{1,2}\/\d{1,2}\/\d{4})/,
        /(\d{1,2}-\d{1,2}-\d{4})/,
        /(\d{4}-\d{1,2}-\d{1,2})/
    ];

    // Extract merchant name (usually one of the first few lines)
    const merchantCandidates = lines.slice(0, 5).filter(line => 
        line.length > 3 && 
        !line.match(/\d+\.\d{2}/) && 
        !line.match(/\d{1,2}\/\d{1,2}\/\d{4}/)
    );
    if (merchantCandidates.length > 0) {
        result.merchant = merchantCandidates[0];
    }

    // Extract amounts
    for (const line of lines) {
        for (const pattern of amountPatterns) {
            const matches = line.match(pattern);
            if (matches) {
                const amount = parseFloat(matches[1] || matches[0].replace('$', ''));
                if (amount > 0 && amount < 10000) { // Reasonable amount range
                    result.possibleAmounts.push({
                        amount,
                        context: line,
                        confidence: line.toLowerCase().includes('total') ? 'high' : 'medium'
                    });
                }
            }
        }
    }

    // Select the most likely total amount
    const totalAmounts = result.possibleAmounts.filter(a => a.confidence === 'high');
    if (totalAmounts.length > 0) {
        result.amount = totalAmounts[0].amount;
    } else if (result.possibleAmounts.length > 0) {
        // Take the largest amount if no clear total found
        result.amount = Math.max(...result.possibleAmounts.map(a => a.amount));
    }

    // Extract date
    for (const line of lines) {
        for (const pattern of datePatterns) {
            const match = line.match(pattern);
            if (match) {
                try {
                    const date = new Date(match[1]);
                    if (date.getFullYear() > 2000 && date.getFullYear() <= new Date().getFullYear()) {
                        result.date = date;
                        break;
                    }
                } catch (error) {
                    // Invalid date, continue searching
                }
            }
        }
        if (result.date) break;
    }

    // Extract potential items (lines with prices)
    result.items = lines
        .filter(line => line.match(/\$?\d+\.\d{2}/) && line.length < 100)
        .map(line => line.trim())
        .slice(0, 20); // Limit to 20 items max

    return result;
};

// Generate description based on extracted data
const generateDescription = (extractedData) => {
    if (extractedData.merchant) {
        return `Purchase from ${extractedData.merchant}`;
    }
    
    if (extractedData.items && extractedData.items.length > 0) {
        const firstItem = extractedData.items[0].replace(/\$?\d+\.\d{2}/, '').trim();
        if (firstItem) {
            return `Purchase - ${firstItem}`;
        }
    }
    
    return 'Receipt purchase';
};

// Suggest category based on merchant name
const suggestCategory = (extractedData) => {
    if (!extractedData.merchant) return null;
    
    const merchant = extractedData.merchant.toLowerCase();
    
    // Common merchant patterns
    const categoryMap = {
        'food': ['restaurant', 'cafe', 'pizza', 'burger', 'starbucks', 'mcdonald', 'subway', 'food'],
        'gas': ['shell', 'exxon', 'bp', 'chevron', 'gas', 'fuel'],
        'grocery': ['walmart', 'target', 'costco', 'safeway', 'kroger', 'grocery', 'market'],
        'pharmacy': ['cvs', 'walgreens', 'pharmacy', 'drug'],
        'retail': ['amazon', 'best buy', 'home depot', 'lowes', 'mall']
    };
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
        if (keywords.some(keyword => merchant.includes(keyword))) {
            return category;
        }
    }
    
    return null;
};

module.exports = {
    processReceiptImage,
    extractReceiptData,
    generateDescription,
    suggestCategory
};
