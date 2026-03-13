const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const createRideRequest = async (req, res, next) => {
  try {
    const {
      originAddress, originLat, originLng,
      destinationAddress, destinationLat, destinationLng,
      desiredDeparture, flexibilityMinutes, seatsNeeded,
      maxPrice, biddingDeadline, description,
    } = req.body;

    if (biddingDeadline && new Date(biddingDeadline) <= new Date()) {
      throw new AppError('Bidding deadline must be in the future', 400);
    }

    if (biddingDeadline && new Date(biddingDeadline) >= new Date(desiredDeparture)) {
      throw new AppError('Bidding deadline must be before the departure time', 400);
    }

    const result = await query(
      `INSERT INTO ride_requests
        (passenger_id, origin_address, origin_lat, origin_lng,
         destination_address, destination_lat, destination_lng,
         desired_departure, flexibility_minutes, seats_needed,
         max_price, bidding_deadline, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.user.id, originAddress, originLat, originLng,
        destinationAddress, destinationLat, destinationLng,
        desiredDeparture, flexibilityMinutes || 30, seatsNeeded || 1,
        maxPrice, biddingDeadline || null, description,
      ]
    );

    res.status(201).json({ message: 'Ride request created', rideRequest: formatRequest(result.rows[0]) });
  } catch (err) {
    next(err);
  }
};

const updateRideRequest = async (req, res, next) => {
  try {
    const existing = await query('SELECT * FROM ride_requests WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) throw new AppError('Ride request not found', 404);
    if (existing.rows[0].passenger_id !== req.user.id) throw new AppError('Not authorized', 403);
    if (existing.rows[0].status !== 'open') throw new AppError('Can only update open ride requests', 400);

    const activeBids = await query(
      `SELECT COUNT(*) FROM bids WHERE ride_request_id = $1 AND status = 'pending'`,
      [req.params.id]
    );
    if (parseInt(activeBids.rows[0].count, 10) > 0) {
      throw new AppError('Cannot update ride request with pending bids. Cancel existing bids first.', 400);
    }

    const {
      originAddress, originLat, originLng,
      destinationAddress, destinationLat, destinationLng,
      desiredDeparture, flexibilityMinutes, seatsNeeded,
      maxPrice, biddingDeadline, description,
    } = req.body;

    if (biddingDeadline && new Date(biddingDeadline) <= new Date()) {
      throw new AppError('Bidding deadline must be in the future', 400);
    }

    const departure = desiredDeparture || existing.rows[0].desired_departure;
    if (biddingDeadline && new Date(biddingDeadline) >= new Date(departure)) {
      throw new AppError('Bidding deadline must be before the departure time', 400);
    }

    const updates = [];
    const values = [];
    let idx = 1;

    const fields = {
      origin_address: originAddress,
      origin_lat: originLat,
      origin_lng: originLng,
      destination_address: destinationAddress,
      destination_lat: destinationLat,
      destination_lng: destinationLng,
      desired_departure: desiredDeparture,
      flexibility_minutes: flexibilityMinutes,
      seats_needed: seatsNeeded,
      max_price: maxPrice,
      bidding_deadline: biddingDeadline,
      description,
    };

    for (const [col, val] of Object.entries(fields)) {
      if (val !== undefined) {
        updates.push(`${col} = $${idx++}`);
        values.push(val);
      }
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    values.push(req.params.id);

    const result = await query(
      `UPDATE ride_requests SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json({ message: 'Ride request updated', rideRequest: formatRequest(result.rows[0]) });
  } catch (err) {
    next(err);
  }
};

const getRideRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    let whereClause = `rr.status = 'open' AND rr.desired_departure > NOW()`;
    const params = [];
    let paramIdx = 1;

    if (req.query.minPrice) {
      whereClause += ` AND rr.max_price >= $${paramIdx++}`;
      params.push(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      whereClause += ` AND rr.max_price <= $${paramIdx++}`;
      params.push(req.query.maxPrice);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM ride_requests rr WHERE ${whereClause}`,
      params
    );

    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT rr.*, u.first_name, u.last_name, u.trust_score,
              (SELECT COUNT(*) FROM bids b WHERE b.ride_request_id = rr.id AND b.status = 'pending') as bid_count
       FROM ride_requests rr
       JOIN users u ON rr.passenger_id = u.id
       WHERE ${whereClause}
       ORDER BY rr.desired_departure ASC
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      params
    );

    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      rideRequests: result.rows.map((r) => ({
        ...formatRequest(r),
        passenger: { firstName: r.first_name, lastName: r.last_name, trustScore: r.trust_score },
        bidCount: parseInt(r.bid_count, 10),
        biddingOpen: isBiddingOpen(r),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

const getRideRequestById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT rr.*, u.first_name, u.last_name, u.trust_score
       FROM ride_requests rr JOIN users u ON rr.passenger_id = u.id
       WHERE rr.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Ride request not found', 404);
    }

    const bidsResult = await query(
      `SELECT b.*, u.first_name, u.last_name, u.trust_score
       FROM bids b JOIN users u ON b.bidder_id = u.id
       WHERE b.ride_request_id = $1 ORDER BY b.amount ASC, b.created_at ASC`,
      [req.params.id]
    );

    const r = result.rows[0];
    res.json({
      rideRequest: {
        ...formatRequest(r),
        passenger: { firstName: r.first_name, lastName: r.last_name, trustScore: r.trust_score },
        biddingOpen: isBiddingOpen(r),
        bids: bidsResult.rows.map(formatBidSummary),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMyRequests = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT rr.*,
              (SELECT COUNT(*) FROM bids b WHERE b.ride_request_id = rr.id AND b.status = 'pending') as bid_count
       FROM ride_requests rr
       WHERE rr.passenger_id = $1
       ORDER BY rr.desired_departure DESC`,
      [req.user.id]
    );
    res.json({
      rideRequests: result.rows.map((r) => ({
        ...formatRequest(r),
        bidCount: parseInt(r.bid_count, 10),
        biddingOpen: isBiddingOpen(r),
      })),
    });
  } catch (err) {
    next(err);
  }
};

const cancelRideRequest = async (req, res, next) => {
  try {
    const existing = await query('SELECT * FROM ride_requests WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) throw new AppError('Ride request not found', 404);
    if (existing.rows[0].passenger_id !== req.user.id) throw new AppError('Not authorized', 403);
    if (existing.rows[0].status === 'cancelled') throw new AppError('Ride request already cancelled', 400);

    await query(
      `UPDATE ride_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    await query(
      `UPDATE bids SET status = 'rejected', updated_at = NOW()
       WHERE ride_request_id = $1 AND status = 'pending'`,
      [req.params.id]
    );

    res.json({ message: 'Ride request cancelled' });
  } catch (err) {
    next(err);
  }
};

function isBiddingOpen(rideRequest) {
  if (rideRequest.status !== 'open') return false;
  if (rideRequest.bidding_deadline && new Date(rideRequest.bidding_deadline) <= new Date()) {
    return false;
  }
  return true;
}

function formatRequest(r) {
  return {
    id: r.id,
    passengerId: r.passenger_id,
    origin: { address: r.origin_address, lat: r.origin_lat, lng: r.origin_lng },
    destination: { address: r.destination_address, lat: r.destination_lat, lng: r.destination_lng },
    desiredDeparture: r.desired_departure,
    flexibilityMinutes: r.flexibility_minutes,
    seatsNeeded: r.seats_needed,
    maxPrice: r.max_price,
    biddingDeadline: r.bidding_deadline,
    description: r.description,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function formatBidSummary(b) {
  return {
    id: b.id,
    bidderId: b.bidder_id,
    bidderName: `${b.first_name} ${b.last_name}`,
    bidderTrustScore: b.trust_score,
    amount: b.amount,
    seatsRequested: b.seats_requested,
    message: b.message,
    status: b.status,
    createdAt: b.created_at,
  };
}

module.exports = {
  createRideRequest,
  updateRideRequest,
  getRideRequests,
  getRideRequestById,
  getMyRequests,
  cancelRideRequest,
};
