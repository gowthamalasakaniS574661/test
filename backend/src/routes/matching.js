const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getRankedDrivers, getNearbyRides } = require('../controllers/matchingController');

router.get('/rank/:requestId', authenticate, getRankedDrivers);
router.get('/nearby', authenticate, getNearbyRides);

module.exports = router;
