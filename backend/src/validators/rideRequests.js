const { body, param, query: queryValidator } = require('express-validator');

const createRideRequestValidation = [
  body('originAddress').trim().notEmpty().withMessage('Pickup location address is required'),
  body('originLat').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('originLng').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('destinationAddress').trim().notEmpty().withMessage('Destination address is required'),
  body('destinationLat').optional().isFloat({ min: -90, max: 90 }),
  body('destinationLng').optional().isFloat({ min: -180, max: 180 }),
  body('desiredDeparture').isISO8601().withMessage('Valid departure time is required'),
  body('flexibilityMinutes').optional().isInt({ min: 0, max: 1440 }).withMessage('Flexibility must be 0-1440 minutes'),
  body('seatsNeeded').optional().isInt({ min: 1, max: 10 }).withMessage('Seats needed must be between 1 and 10'),
  body('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be non-negative'),
  body('biddingDeadline').optional().isISO8601().withMessage('Valid bidding deadline is required'),
  body('description').optional().trim(),
];

const updateRideRequestValidation = [
  param('id').isUUID().withMessage('Valid ride request ID is required'),
  body('originAddress').optional().trim().notEmpty().withMessage('Pickup location cannot be empty'),
  body('originLat').optional().isFloat({ min: -90, max: 90 }),
  body('originLng').optional().isFloat({ min: -180, max: 180 }),
  body('destinationAddress').optional().trim().notEmpty().withMessage('Destination cannot be empty'),
  body('destinationLat').optional().isFloat({ min: -90, max: 90 }),
  body('destinationLng').optional().isFloat({ min: -180, max: 180 }),
  body('desiredDeparture').optional().isISO8601().withMessage('Valid departure time is required'),
  body('flexibilityMinutes').optional().isInt({ min: 0, max: 1440 }),
  body('seatsNeeded').optional().isInt({ min: 1, max: 10 }),
  body('maxPrice').optional().isFloat({ min: 0 }),
  body('biddingDeadline').optional().isISO8601().withMessage('Valid bidding deadline is required'),
  body('description').optional().trim(),
];

const rideRequestIdValidation = [
  param('id').isUUID().withMessage('Valid ride request ID is required'),
];

const searchRideRequestsValidation = [
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 50 }),
  queryValidator('minPrice').optional().isFloat({ min: 0 }),
  queryValidator('maxPrice').optional().isFloat({ min: 0 }),
];

module.exports = {
  createRideRequestValidation,
  updateRideRequestValidation,
  rideRequestIdValidation,
  searchRideRequestsValidation,
};
