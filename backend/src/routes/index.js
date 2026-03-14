const express = require('express');
const router = express.Router();
const { getDirections } = require('../controllers/trackingController');
const { authenticate } = require('../middleware/auth');

router.use('/auth', require('./auth'));
router.use('/rides', require('./rides'));
router.use('/ride-requests', require('./rideRequests'));
router.use('/bids', require('./bids'));
router.use('/bookings', require('./bookings'));
router.use('/ratings', require('./ratings'));
router.use('/payments', require('./payments'));
router.use('/trust-score', require('./trustScore'));
router.get('/directions', authenticate, getDirections);

module.exports = router;
