const express = require('express');
const router = express.Router();
const { initiatePayment, getPaymentStatus, completePayment, getMyPayments } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, initiatePayment);
router.get('/my', authenticate, getMyPayments);
router.get('/:id', authenticate, getPaymentStatus);
router.post('/:id/complete', authenticate, completePayment);

module.exports = router;
