const { query, getClient } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const createBooking = async (req, res, next) => {
  const client = await getClient();
  try {
    const { rideId, seatsBooked, pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng } = req.body;

    await client.query('BEGIN');

    const ride = await client.query('SELECT * FROM rides WHERE id = $1 FOR UPDATE', [rideId]);
    if (ride.rows.length === 0) throw new AppError('Ride not found', 404);
    if (ride.rows[0].status !== 'active') throw new AppError('Ride is not available', 400);
    if (ride.rows[0].driver_id === req.user.id) throw new AppError('Cannot book your own ride', 400);

    const seats = seatsBooked || 1;
    if (seats > ride.rows[0].available_seats) throw new AppError('Not enough seats available', 400);

    const totalPrice = parseFloat(ride.rows[0].price_per_seat) * seats;

    const result = await client.query(
      `INSERT INTO bookings (ride_id, passenger_id, seats_booked, total_price,
        pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [rideId, req.user.id, seats, totalPrice,
       pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng]
    );

    const newSeats = ride.rows[0].available_seats - seats;
    const newStatus = newSeats === 0 ? 'full' : 'active';
    await client.query(
      'UPDATE rides SET available_seats = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [newSeats, newStatus, rideId]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Booking confirmed', booking: formatBooking(result.rows[0]) });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, r.origin_address, r.destination_address, r.departure_time,
              u.first_name as driver_first_name, u.last_name as driver_last_name,
              p.status as payment_status, p.id as payment_id
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       JOIN users u ON r.driver_id = u.id
       LEFT JOIN payments p ON p.booking_id = b.id AND p.status NOT IN ('failed', 'refunded')
       WHERE b.passenger_id = $1
       ORDER BY r.departure_time DESC`,
      [req.user.id]
    );

    res.json({
      bookings: result.rows.map((b) => ({
        ...formatBooking(b),
        rideOrigin: b.origin_address,
        rideDestination: b.destination_address,
        departureTime: b.departure_time,
        driverName: `${b.driver_first_name} ${b.driver_last_name}`,
        paymentStatus: b.payment_status || null,
        paymentId: b.payment_id || null,
      })),
    });
  } catch (err) {
    next(err);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, r.origin_address, r.origin_lat, r.origin_lng,
              r.destination_address, r.destination_lat, r.destination_lng,
              r.departure_time, r.driver_id,
              u.first_name as driver_first_name, u.last_name as driver_last_name,
              p.first_name as passenger_first_name, p.last_name as passenger_last_name
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       JOIN users u ON r.driver_id = u.id
       JOIN users p ON b.passenger_id = p.id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) throw new AppError('Booking not found', 404);

    const b = result.rows[0];
    if (b.passenger_id !== req.user.id && b.driver_id !== req.user.id) {
      throw new AppError('Not authorized to view this booking', 403);
    }

    res.json({
      booking: {
        ...formatBooking(b),
        rideOrigin: b.origin_address,
        rideDestination: b.destination_address,
        departureTime: b.departure_time,
        driverName: `${b.driver_first_name} ${b.driver_last_name}`,
        passengerName: `${b.passenger_first_name} ${b.passenger_last_name}`,
        ride: {
          driverId: b.driver_id,
          origin: {
            address: b.origin_address,
            lat: b.origin_lat ? parseFloat(b.origin_lat) : null,
            lng: b.origin_lng ? parseFloat(b.origin_lng) : null,
          },
          destination: {
            address: b.destination_address,
            lat: b.destination_lat ? parseFloat(b.destination_lat) : null,
            lng: b.destination_lng ? parseFloat(b.destination_lng) : null,
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const booking = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (booking.rows.length === 0) throw new AppError('Booking not found', 404);
    if (booking.rows[0].passenger_id !== req.user.id) throw new AppError('Not authorized', 403);
    if (booking.rows[0].status !== 'confirmed') throw new AppError('Can only cancel confirmed bookings', 400);

    await client.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    await client.query(
      `UPDATE rides SET available_seats = available_seats + $1,
       status = CASE WHEN status = 'full' THEN 'active' ELSE status END,
       updated_at = NOW() WHERE id = $2`,
      [booking.rows[0].seats_booked, booking.rows[0].ride_id]
    );

    const escrowPayment = await client.query(
      `SELECT * FROM payments WHERE booking_id = $1 AND status IN ('escrow', 'pending') LIMIT 1`,
      [req.params.id]
    );

    let refunded = false;
    if (escrowPayment.rows.length > 0) {
      try {
        const stripe = require('../config/stripe');
        const p = escrowPayment.rows[0];

        if (p.stripe_payment_intent_id) {
          const paymentIntent = await stripe.paymentIntents.retrieve(p.stripe_payment_intent_id);
          if (paymentIntent.status === 'requires_capture') {
            await stripe.paymentIntents.cancel(p.stripe_payment_intent_id);
          } else if (paymentIntent.status === 'succeeded') {
            await stripe.refunds.create({ payment_intent: p.stripe_payment_intent_id });
          }
        }

        await client.query(
          `UPDATE payments SET status = 'refunded', refunded_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [p.id]
        );
        refunded = true;
      } catch (stripeErr) {
        console.error('Stripe refund failed during booking cancellation:', stripeErr.message);
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Booking cancelled', paymentRefunded: refunded });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const completeBooking = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const booking = await client.query(
      'SELECT b.*, r.driver_id FROM bookings b JOIN rides r ON b.ride_id = r.id WHERE b.id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (booking.rows.length === 0) throw new AppError('Booking not found', 404);
    if (booking.rows[0].driver_id !== req.user.id) throw new AppError('Only the driver can complete a booking', 403);
    if (booking.rows[0].status !== 'confirmed' && booking.rows[0].status !== 'in_progress') {
      throw new AppError('Booking cannot be completed', 400);
    }

    await client.query(
      `UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    const escrowPayment = await client.query(
      `SELECT * FROM payments WHERE booking_id = $1 AND status = 'escrow' LIMIT 1`,
      [req.params.id]
    );

    let paymentCaptured = false;
    if (escrowPayment.rows.length > 0) {
      try {
        const stripe = require('../config/stripe');
        const p = escrowPayment.rows[0];

        await stripe.paymentIntents.capture(p.stripe_payment_intent_id);
        await client.query(
          `UPDATE payments SET status = 'completed', captured_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [p.id]
        );
        paymentCaptured = true;
      } catch (stripeErr) {
        console.error('Stripe capture failed during booking completion:', stripeErr.message);
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Booking completed', paymentCaptured });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

function formatBooking(b) {
  return {
    id: b.id,
    rideId: b.ride_id,
    passengerId: b.passenger_id,
    bidId: b.bid_id,
    seatsBooked: b.seats_booked,
    totalPrice: b.total_price,
    status: b.status,
    pickup: b.pickup_address ? { address: b.pickup_address, lat: b.pickup_lat, lng: b.pickup_lng } : null,
    dropoff: b.dropoff_address ? { address: b.dropoff_address, lat: b.dropoff_lat, lng: b.dropoff_lng } : null,
    createdAt: b.created_at,
  };
}

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking, completeBooking };
