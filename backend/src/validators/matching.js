const { param, query } = require('express-validator');

const matchDriversValidation = [
  param('requestId').isUUID().withMessage('Valid ride request ID is required'),
  query('wBidPrice').optional().isFloat({ min: 0, max: 1 }).withMessage('Weight must be between 0 and 1'),
  query('wDriverRating').optional().isFloat({ min: 0, max: 1 }).withMessage('Weight must be between 0 and 1'),
  query('wDistance').optional().isFloat({ min: 0, max: 1 }).withMessage('Weight must be between 0 and 1'),
  query('wTrustScore').optional().isFloat({ min: 0, max: 1 }).withMessage('Weight must be between 0 and 1'),
];

module.exports = { matchDriversValidation };
