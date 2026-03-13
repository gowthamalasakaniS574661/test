const express = require('express');
const router = express.Router();
const {
  createRideRequest, updateRideRequest, getRideRequests,
  getRideRequestById, getMyRequests, cancelRideRequest,
} = require('../controllers/rideRequestController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createRideRequestValidation, updateRideRequestValidation,
  rideRequestIdValidation, searchRideRequestsValidation,
} = require('../validators/rideRequests');

router.get('/', authenticate, validate(searchRideRequestsValidation), getRideRequests);
router.get('/my', authenticate, getMyRequests);
router.get('/:id', authenticate, validate(rideRequestIdValidation), getRideRequestById);
router.post('/', authenticate, authorize('passenger', 'both'), validate(createRideRequestValidation), createRideRequest);
router.put('/:id', authenticate, authorize('passenger', 'both'), validate(updateRideRequestValidation), updateRideRequest);
router.post('/:id/cancel', authenticate, validate(rideRequestIdValidation), cancelRideRequest);

module.exports = router;
