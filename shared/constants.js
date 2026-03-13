module.exports = {
  USER_ROLES: {
    DRIVER: 'driver',
    PASSENGER: 'passenger',
    BOTH: 'both',
  },

  RIDE_STATUS: {
    ACTIVE: 'active',
    FULL: 'full',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  REQUEST_STATUS: {
    OPEN: 'open',
    MATCHED: 'matched',
    BOOKED: 'booked',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  BID_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
  },

  BOOKING_STATUS: {
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    DISPUTED: 'disputed',
  },

  PAYMENT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },

  RATING_RANGE: {
    MIN: 1,
    MAX: 5,
  },
};
