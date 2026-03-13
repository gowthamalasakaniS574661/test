const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getBookingById, cancelBooking, completeBooking } = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, createBooking);
router.get('/my', authenticate, getMyBookings);
router.get('/:id', authenticate, getBookingById);
router.post('/:id/cancel', authenticate, cancelBooking);
router.post('/:id/complete', authenticate, completeBooking);

module.exports = router;
