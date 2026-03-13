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

      if (request.rows[0].bidding_deadline && new Date(request.rows[0].bidding_deadline) <= new Date()) {
        throw new AppError('Bidding deadline has passed for this ride request', 400);
      }

      if (request.rows[0].max_price && amount > parseFloat(request.rows[0].max_price)) {
        throw new AppError(`Bid amount cannot exceed the maximum price of ${request.rows[0].max_price}`, 400);
      }
    }

    const existingBid = await query(
      `SELECT id FROM bids WHERE bidder_id = $1 AND status = 'pending'
       AND (ride_id = $2 OR ride_request_id = $3)`,
      [req.user.id, rideId || null, rideRequestId || null]
    );
    if (existingBid.rows.length > 0) {
      throw new AppError('You already have a pending bid for this request', 400);
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

const updateBid = async (req, res, next) => {
  try {
    const bid = await query('SELECT * FROM bids WHERE id = $1', [req.params.id]);
    if (bid.rows.length === 0) throw new AppError('Bid not found', 404);
    if (bid.rows[0].bidder_id !== req.user.id) throw new AppError('Not authorized', 403);
    if (bid.rows[0].status !== 'pending') throw new AppError('Can only update pending bids', 400);

    if (bid.rows[0].ride_request_id) {
      const request = await query('SELECT * FROM ride_requests WHERE id = $1', [bid.rows[0].ride_request_id]);
      if (request.rows.length > 0) {
        if (request.rows[0].bidding_deadline && new Date(request.rows[0].bidding_deadline) <= new Date()) {
          throw new AppError('Bidding deadline has passed; cannot update bid', 400);
        }
        if (req.body.amount && request.rows[0].max_price && req.body.amount > parseFloat(request.rows[0].max_price)) {
          throw new AppError(`Bid amount cannot exceed the maximum price of ${request.rows[0].max_price}`, 400);
        }
      }
    }

    if (bid.rows[0].ride_id) {
      const ride = await query('SELECT * FROM rides WHERE id = $1', [bid.rows[0].ride_id]);
      if (ride.rows.length > 0 && req.body.amount && req.body.amount < parseFloat(ride.rows[0].min_bid_price)) {
        throw new AppError(`Bid must be at least ${ride.rows[0].min_bid_price}`, 400);
      }
    }

    const { amount, seatsRequested, message } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (amount !== undefined) {
      updates.push(`amount = $${idx++}`);
      values.push(amount);
    }
    if (seatsRequested !== undefined) {
      updates.push(`seats_requested = $${idx++}`);
      values.push(seatsRequested);
    }
    if (message !== undefined) {
      updates.push(`message = $${idx++}`);
      values.push(message);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    values.push(req.params.id);

    const result = await query(
      `UPDATE bids SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json({ message: 'Bid updated', bid: formatBid(result.rows[0]) });
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
      const rideStatus = newSeats === 0 ? 'full' : 'active';
      await client.query(
        'UPDATE rides SET available_seats = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [newSeats, rideStatus, bid.ride_id]
      );
    }

    if (action === 'accept' && bid.ride_request_id) {
      await client.query(
        `UPDATE ride_requests SET status = 'matched', updated_at = NOW() WHERE id = $1`,
        [bid.ride_request_id]
      );
      await client.query(
        `UPDATE bids SET status = 'rejected', updated_at = NOW()
         WHERE ride_request_id = $1 AND id != $2 AND status = 'pending'`,
        [bid.ride_request_id, bidId]
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

const getBidsForRequest = async (req, res, next) => {
  try {
    const request = await query('SELECT * FROM ride_requests WHERE id = $1', [req.params.requestId]);
    if (request.rows.length === 0) throw new AppError('Ride request not found', 404);

    const result = await query(
      `SELECT b.*, u.first_name, u.last_name, u.trust_score,
              dp.vehicle_make, dp.vehicle_model, dp.vehicle_year, dp.vehicle_color
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       LEFT JOIN driver_profiles dp ON u.id = dp.user_id
       WHERE b.ride_request_id = $1
       ORDER BY b.amount ASC, b.created_at ASC`,
      [req.params.requestId]
    );

    res.json({
      bids: result.rows.map((b) => ({
        ...formatBid(b),
        bidderName: `${b.first_name} ${b.last_name}`,
        bidderTrustScore: b.trust_score,
        vehicle: b.vehicle_make ? {
          make: b.vehicle_make,
          model: b.vehicle_model,
          year: b.vehicle_year,
          color: b.vehicle_color,
        } : null,
      })),
    });
  } catch (err) {
    next(err);
  }
};

const getMyBids = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*,
              r.origin_address as ride_origin, r.destination_address as ride_destination,
              rr.origin_address as request_origin, rr.destination_address as request_destination,
              rr.max_price as request_max_price, rr.bidding_deadline as request_bidding_deadline
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
        requestMaxPrice: b.request_max_price,
        requestBiddingDeadline: b.request_bidding_deadline,
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
    updatedAt: b.updated_at,
  };
}

module.exports = { createBid, updateBid, respondToBid, getBidsForRequest, getMyBids, withdrawBid };
