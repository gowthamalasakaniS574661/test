const express = require('express');
const router = express.Router();
const { createRideRequest, getRideRequests, getRideRequestById, getMyRequests, cancelRideRequest } = require('../controllers/rideRequestController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getRideRequests);
router.get('/my', authenticate, getMyRequests);
router.get('/:id', authenticate, getRideRequestById);
router.post('/', authenticate, createRideRequest);
router.post('/:id/cancel', authenticate, cancelRideRequest);

module.exports = router;
