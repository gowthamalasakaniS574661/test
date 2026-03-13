const express = require('express');
const router = express.Router();
const { getMatchedDrivers } = require('../controllers/matchingController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { matchDriversValidation } = require('../validators/matching');

router.get(
  '/ride-requests/:requestId',
  authenticate,
  validate(matchDriversValidation),
  getMatchedDrivers
);

module.exports = router;
