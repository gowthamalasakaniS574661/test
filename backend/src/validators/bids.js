const { body, param } = require('express-validator');

const createBidValidation = [
  body('rideId').optional().isUUID().withMessage('Valid ride ID is required'),
  body('rideRequestId').optional().isUUID().withMessage('Valid ride request ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Bid amount must be non-negative'),
  body('seatsRequested').optional().isInt({ min: 1, max: 10 }).withMessage('Seats requested must be between 1 and 10'),
  body('message').optional().trim(),
];

const updateBidValidation = [
  param('id').isUUID().withMessage('Valid bid ID is required'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Bid amount must be non-negative'),
  body('seatsRequested').optional().isInt({ min: 1, max: 10 }).withMessage('Seats requested must be between 1 and 10'),
  body('message').optional().trim(),
];

const bidIdValidation = [
  param('id').isUUID().withMessage('Valid bid ID is required'),
];

const respondBidValidation = [
  param('id').isUUID().withMessage('Valid bid ID is required'),
  body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject'),
];

module.exports = { createBidValidation, updateBidValidation, bidIdValidation, respondBidValidation };
