module.exports = {
  USER_ROLES: {
    DRIVER: 'driver',
    PASSENGER: 'passenger',
    BOTH: 'both',
    ADMIN: 'admin',
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

  DOCUMENT_TYPES: {
    DRIVERS_LICENSE: 'drivers_license',
    VEHICLE_REGISTRATION: 'vehicle_registration',
    INSURANCE: 'insurance',
    GOVERNMENT_ID: 'government_id',
    BACKGROUND_CHECK: 'background_check',
  },

  DOCUMENT_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
  },

  REPORT_REASONS: {
    HARASSMENT: 'harassment',
    UNSAFE_DRIVING: 'unsafe_driving',
    FRAUD: 'fraud',
    NO_SHOW: 'no_show',
    INAPPROPRIATE: 'inappropriate',
    SPAM: 'spam',
    OTHER: 'other',
  },

  NOTIFICATION_TYPES: {
    BID_RECEIVED: 'bid_received',
    BID_ACCEPTED: 'bid_accepted',
    BID_REJECTED: 'bid_rejected',
    BOOKING_CONFIRMED: 'booking_confirmed',
    RIDE_STARTED: 'ride_started',
    RIDE_COMPLETED: 'ride_completed',
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_FAILED: 'payment_failed',
    RATING_RECEIVED: 'rating_received',
    CANCELLATION: 'cancellation',
    ADMIN_MESSAGE: 'admin_message',
  },

  AD_PLACEMENTS: {
    SEARCH: 'search',
    DRIVER_DASHBOARD: 'driver_dashboard',
    DESTINATION: 'destination',
    TRACKING: 'tracking',
    ALL: 'all',
  },
};
