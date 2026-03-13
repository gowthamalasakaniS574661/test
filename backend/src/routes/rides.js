const express = require('express');
const router = express.Router();
const { createRide, getRides, getRideById, updateRide, cancelRide, getMyRides } = require('../controllers/rideController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createRideValidation, searchRidesValidation, rideIdValidation } = require('../validators/rides');

router.get('/', validate(searchRidesValidation), getRides);
router.get('/my', authenticate, authorize('driver', 'both'), getMyRides);
router.get('/:id', validate(rideIdValidation), getRideById);
router.post('/', authenticate, authorize('driver', 'both'), validate(createRideValidation), createRide);
router.put('/:id', authenticate, authorize('driver', 'both'), validate(rideIdValidation), updateRide);
router.post('/:id/cancel', authenticate, authorize('driver', 'both'), validate(rideIdValidation), cancelRide);

module.exports = router;
