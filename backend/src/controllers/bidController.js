const { query, getClient } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const createBid = async (req, res, next) => {
  try {
    const { rideId, rideRequestId, amount, seatsRequested, message } = req.body;

    if (!rideId && !rideRequestId) {
      throw new AppError('Either rideId or rideRequestId is required', 400);
    }

    if (rideId) {
      const ride = await query('SELECT * FROM rides WHERE id = $1', [rideId]);
      if (ride.rows.length === 0) throw new AppError('Ride not found', 404);
      if (ride.rows[0].status !== 'active') throw new AppError('Ride is not active', 400);
      if (!ride.rows[0].allow_bidding) throw new AppError('This ride does not accept bids', 400);
      if (ride.rows[0].driver_id === req.user.id) throw new AppError('Cannot bid on your own ride', 400);
      if (amount < parseFloat(ride.rows[0].min_bid_price)) {
        throw new AppError(`Bid must be at least ${ride.rows[0].min_bid_price}`, 400);
      }
    }

    if (rideRequestId) {
      const request = await query('SELECT * FROM ride_requests WHERE id = $1', [rideRequestId]);
      if (request.rows.length === 0) throw new AppError('Ride request not found', 404);
      if (request.rows[0].status !== 'open') throw new AppError('Ride request is not open', 400);
      if (request.rows[0].passenger_id === req.user.id) throw new AppError('Cannot bid on your own request', 400);
    }

    const existingBid = await query(
      `SELECT id FROM bids WHERE bidder_id = $1 AND status = 'pending'
       AND (ride_id = $2 OR ride_request_id = $3)`,
      [req.user.id, rideId || null, rideRequestId || null]
    );
    if (existingBid.rows.length > 0) {
      throw new AppError('You already have a pending bid', 400);
    }

    const result = await query(
      `INSERT INTO bids (ride_id, ride_request_id, bidder_id, amount, seats_requested, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [rideId || null, rideRequestId || null, req.user.id, amount, seatsRequested || 1, message]
    );

    res.status(201).json({ message: 'Bid placed', bid: formatBid(result.rows[0]) });
  } catch (err) {
    next(err);
  }
};

const respondToBid = async (req, res, next) => {
  const client = await getClient();
  try {
    const { action } = req.body;
    const bidId = req.params.id;

    await client.query('BEGIN');

    const bidResult = await client.query('SELECT * FROM bids WHERE id = $1 FOR UPDATE', [bidId]);
    if (bidResult.rows.length === 0) throw new AppError('Bid not found', 404);

    const bid = bidResult.rows[0];
    if (bid.status !== 'pending') throw new AppError('Bid is no longer pending', 400);

    if (bid.ride_id) {
      const ride = await client.query('SELECT * FROM rides WHERE id = $1', [bid.ride_id]);
      if (ride.rows[0].driver_id !== req.user.id) throw new AppError('Not authorized', 403);
    } else if (bid.ride_request_id) {
      const request = await client.query('SELECT * FROM ride_requests WHERE id = $1', [bid.ride_request_id]);
      if (request.rows[0].passenger_id !== req.user.id) throw new AppError('Not authorized', 403);
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await client.query('UPDATE bids SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, bidId]);

    if (action === 'accept' && bid.ride_id) {
      const ride = await client.query('SELECT * FROM rides WHERE id = $1', [bid.ride_id]);
      if (bid.seats_requested > ride.rows[0].available_seats) {
        throw new AppError('Not enough available seats', 400);
      }

      await client.query(
        `INSERT INTO bookings (ride_id, passenger_id, bid_id, seats_booked, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [bid.ride_id, bid.bidder_id, bid.id, bid.seats_requested, bid.amount * bid.seats_requested]
      );

      const newSeats = ride.rows[0].available_seats - bid.seats_requested;
      const newStatus = newSeats === 0 ? 'full' : 'active';
      await client.query(
        'UPDATE rides SET available_seats = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [newSeats, newStatus, bid.ride_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: `Bid ${action}ed` });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const getMyBids = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*,
              r.origin_address as ride_origin, r.destination_address as ride_destination,
              rr.origin_address as request_origin, rr.destination_address as request_destination
       FROM bids b
       LEFT JOIN rides r ON b.ride_id = r.id
       LEFT JOIN ride_requests rr ON b.ride_request_id = rr.id
       WHERE b.bidder_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json({
      bids: result.rows.map((b) => ({
        ...formatBid(b),
        rideOrigin: b.ride_origin,
        rideDestination: b.ride_destination,
        requestOrigin: b.request_origin,
        requestDestination: b.request_destination,
      })),
    });
  } catch (err) {
    next(err);
  }
};

const withdrawBid = async (req, res, next) => {
  try {
    const bid = await query('SELECT * FROM bids WHERE id = $1', [req.params.id]);
    if (bid.rows.length === 0) throw new AppError('Bid not found', 404);
    if (bid.rows[0].bidder_id !== req.user.id) throw new AppError('Not authorized', 403);
    if (bid.rows[0].status !== 'pending') throw new AppError('Can only withdraw pending bids', 400);

    await query(`UPDATE bids SET status = 'withdrawn', updated_at = NOW() WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Bid withdrawn' });
  } catch (err) {
    next(err);
  }
};

function formatBid(b) {
  return {
    id: b.id,
    rideId: b.ride_id,
    rideRequestId: b.ride_request_id,
    bidderId: b.bidder_id,
    amount: b.amount,
    seatsRequested: b.seats_requested,
    message: b.message,
    status: b.status,
    createdAt: b.created_at,
  };
}

module.exports = { createBid, respondToBid, getMyBids, withdrawBid };
