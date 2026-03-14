const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmEscrow,
  capturePayment,
  refundPayment,
  getPaymentStatus,
  getPaymentByBooking,
  getMyPayments,
  createConnectAccount,
  getConnectAccountStatus,
  getConnectDashboardLink,
  handleWebhook,
} = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.post('/create-intent', authenticate, createPaymentIntent);
router.post('/confirm-escrow', authenticate, confirmEscrow);
router.post('/:id/capture', authenticate, capturePayment);
router.post('/:id/refund', authenticate, refundPayment);
router.get('/my', authenticate, getMyPayments);
router.get('/booking/:bookingId', authenticate, getPaymentByBooking);
router.get('/:id', authenticate, getPaymentStatus);

router.post('/connect/account', authenticate, createConnectAccount);
router.get('/connect/status', authenticate, getConnectAccountStatus);
router.get('/connect/dashboard', authenticate, getConnectDashboardLink);

module.exports = router;
