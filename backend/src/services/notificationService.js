const { query } = require('../config/database');

async function createNotification(userId, type, title, body, data = null) {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, data ? JSON.stringify(data) : null]
    );
    // Placeholder: push notification via Expo Push or FCM
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

async function notifyBidReceived(rideOwnerId, bidderName, rideId) {
  await createNotification(rideOwnerId, 'bid_received',
    'New Bid Received',
    `${bidderName} placed a bid on your ride.`,
    { rideId });
}

async function notifyBidAccepted(bidderId, rideId) {
  await createNotification(bidderId, 'bid_accepted',
    'Bid Accepted!',
    'Your bid has been accepted. Complete payment to confirm.',
    { rideId });
}

async function notifyBookingConfirmed(driverId, passengerId, bookingId) {
  await createNotification(driverId, 'booking_confirmed',
    'New Booking',
    'A passenger has booked your ride.',
    { bookingId });
  await createNotification(passengerId, 'booking_confirmed',
    'Booking Confirmed',
    'Your ride has been booked successfully.',
    { bookingId });
}

async function notifyRideCompleted(passengerId, driverId, bookingId) {
  await createNotification(passengerId, 'ride_completed',
    'Ride Completed',
    'Your ride is complete. Please rate your driver.',
    { bookingId });
  await createNotification(driverId, 'payment_received',
    'Payment Received',
    'Payment for your completed ride has been processed.',
    { bookingId });
}

async function notifyCancellation(userId, message, bookingId) {
  await createNotification(userId, 'cancellation',
    'Booking Cancelled',
    message,
    { bookingId });
}

module.exports = {
  createNotification,
  notifyBidReceived,
  notifyBidAccepted,
  notifyBookingConfirmed,
  notifyRideCompleted,
  notifyCancellation,
};
