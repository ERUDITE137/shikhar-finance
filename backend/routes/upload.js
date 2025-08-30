const express = require('express');
const { upload, uploadReceipt, createTransactionFromReceipt, uploadTransactionHistory, bulkCreateTransactions } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router.post('/receipt', upload, uploadReceipt);
router.post('/create-transaction', createTransactionFromReceipt);
router.post('/transaction-history', upload, uploadTransactionHistory);
router.post('/bulk-create-transactions', bulkCreateTransactions);

module.exports = router;
