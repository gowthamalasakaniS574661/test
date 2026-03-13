const { body, param, query: queryValidator } = require('express-validator');

const createRideValidation = [
  body('originAddress').trim().notEmpty().withMessage('Origin address is required'),
  body('originLat').optional().isFloat({ min: -90, max: 90 }),
  body('originLng').optional().isFloat({ min: -180, max: 180 }),
  body('destinationAddress').trim().notEmpty().withMessage('Destination address is required'),
  body('destinationLat').optional().isFloat({ min: -90, max: 90 }),
  body('destinationLng').optional().isFloat({ min: -180, max: 180 }),
  body('departureTime').isISO8601().withMessage('Valid departure time is required'),
  body('availableSeats').isInt({ min: 1, max: 10 }).withMessage('Available seats must be between 1 and 10'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be non-negative'),
  body('pricePerSeat').isFloat({ min: 0 }).withMessage('Price per seat must be non-negative'),
  body('allowBidding').optional().isBoolean(),
  body('minBidPrice').optional().isFloat({ min: 0 }),
  body('description').optional().trim(),
];

const searchRidesValidation = [
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 50 }),
];

const rideIdValidation = [
  param('id').isUUID().withMessage('Valid ride ID is required'),
];

module.exports = { createRideValidation, searchRidesValidation, rideIdValidation };
