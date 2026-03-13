const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const createRideRequest = async (req, res, next) => {
  try {
    const {
      originAddress, originLat, originLng,
      destinationAddress, destinationLat, destinationLng,
      desiredDeparture, flexibilityMinutes, seatsNeeded, maxPrice, description,
    } = req.body;

    const result = await query(
      `INSERT INTO ride_requests (passenger_id, origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        desired_departure, flexibility_minutes, seats_needed, max_price, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [req.user.id, originAddress, originLat, originLng,
       destinationAddress, destinationLat, destinationLng,
       desiredDeparture, flexibilityMinutes || 30, seatsNeeded || 1, maxPrice, description]
    );

    res.status(201).json({ message: 'Ride request created', rideRequest: formatRequest(result.rows[0]) });
  } catch (err) {
    next(err);
  }
};

const getRideRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*) FROM ride_requests WHERE status = 'open' AND desired_departure > NOW()`
    );

    const result = await query(
      `SELECT rr.*, u.first_name, u.last_name, u.trust_score
       FROM ride_requests rr
       JOIN users u ON rr.passenger_id = u.id
       WHERE rr.status = 'open' AND rr.desired_departure > NOW()
       ORDER BY rr.desired_departure ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      rideRequests: result.rows.map((r) => ({
        ...formatRequest(r),
        passenger: { firstName: r.first_name, lastName: r.last_name, trustScore: r.trust_score },
      })),
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count, 10),
        pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
      },
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
       WHERE b.ride_request_id = $1 ORDER BY b.created_at DESC`,
      [req.params.id]
    );

    const r = result.rows[0];
    res.json({
      rideRequest: {
        ...formatRequest(r),
        passenger: { firstName: r.first_name, lastName: r.last_name, trustScore: r.trust_score },
        bids: bidsResult.rows.map((b) => ({
          id: b.id,
          bidderId: b.bidder_id,
          bidderName: `${b.first_name} ${b.last_name}`,
          bidderTrustScore: b.trust_score,
          amount: b.amount,
          message: b.message,
          status: b.status,
          createdAt: b.created_at,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMyRequests = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM ride_requests WHERE passenger_id = $1 ORDER BY desired_departure DESC`,
      [req.user.id]
    );
    res.json({ rideRequests: result.rows.map(formatRequest) });
  } catch (err) {
    next(err);
  }
};

const cancelRideRequest = async (req, res, next) => {
  try {
    const existing = await query('SELECT * FROM ride_requests WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) throw new AppError('Ride request not found', 404);
    if (existing.rows[0].passenger_id !== req.user.id) throw new AppError('Not authorized', 403);

    await query(`UPDATE ride_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [req.params.id]);
    await query(`UPDATE bids SET status = 'rejected', updated_at = NOW() WHERE ride_request_id = $1 AND status = 'pending'`, [req.params.id]);

    res.json({ message: 'Ride request cancelled' });
  } catch (err) {
    next(err);
  }
};

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
    description: r.description,
    status: r.status,
    createdAt: r.created_at,
  };
}

module.exports = { createRideRequest, getRideRequests, getRideRequestById, getMyRequests, cancelRideRequest };
