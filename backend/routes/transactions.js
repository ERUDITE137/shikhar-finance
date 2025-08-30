const express = require('express');
const {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getAnalytics
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
    .get(getTransactions)
    .post(createTransaction);

router.get('/analytics', getAnalytics);

router.route('/:id')
    .get(getTransaction)
    .put(updateTransaction)
    .delete(deleteTransaction);

module.exports = router;
