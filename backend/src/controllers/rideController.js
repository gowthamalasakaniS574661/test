const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { recalculateAndSave } = require('../services/trustScoreService');

const createRide = async (req, res, next) => {
  try {
    const {
      originAddress, originLat, originLng,
      destinationAddress, destinationLat, destinationLng,
      departureTime, availableSeats, basePrice, pricePerSeat,
      allowBidding, minBidPrice, description,
    } = req.body;

    if (req.user.role !== 'driver' && req.user.role !== 'both') {
      throw new AppError('Only drivers can post rides', 403);
    }

    const result = await query(
      `INSERT INTO rides (driver_id, origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        departure_time, available_seats, base_price, price_per_seat,
        allow_bidding, min_bid_price, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [req.user.id, originAddress, originLat, originLng,
       destinationAddress, destinationLat, destinationLng,
       departureTime, availableSeats, basePrice, pricePerSeat,
       allowBidding !== false, minBidPrice || 0, description]
    );

    res.status(201).json({ message: 'Ride posted', ride: formatRide(result.rows[0]) });
  } catch (err) {
    next(err);
  }
};

const getRides = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const { origin, destination, date, minSeats, maxPrice } = req.query;

    let whereClause = 'WHERE r.status = $1 AND r.departure_time > NOW()';
    const values = ['active'];
    let idx = 2;

    if (origin) {
      whereClause += ` AND r.origin_address ILIKE $${idx++}`;
      values.push(`%${origin}%`);
    }
    if (destination) {
      whereClause += ` AND r.destination_address ILIKE $${idx++}`;
      values.push(`%${destination}%`);
    }
    if (date) {
      whereClause += ` AND DATE(r.departure_time) = $${idx++}`;
      values.push(date);
    }
    if (minSeats) {
      whereClause += ` AND r.available_seats >= $${idx++}`;
      values.push(parseInt(minSeats, 10));
    }
    if (maxPrice) {
      whereClause += ` AND r.price_per_seat <= $${idx++}`;
      values.push(parseFloat(maxPrice));
    }

    values.push(limit, offset);

    const countResult = await query(
      `SELECT COUNT(*) FROM rides r ${whereClause}`,
      values.slice(0, -2)
    );

    const result = await query(
      `SELECT r.*, u.first_name as driver_first_name, u.last_name as driver_last_name,
              u.trust_score as driver_trust_score, u.total_ratings as driver_total_ratings
       FROM rides r
       JOIN users u ON r.driver_id = u.id
       ${whereClause}
       ORDER BY r.departure_time ASC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    res.json({
      rides: result.rows.map(formatRideWithDriver),
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

const getRideById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*, u.first_name as driver_first_name, u.last_name as driver_last_name,
              u.trust_score as driver_trust_score, u.total_ratings as driver_total_ratings,
              dp.vehicle_make, dp.vehicle_model, dp.vehicle_year, dp.vehicle_color
       FROM rides r
       JOIN users u ON r.driver_id = u.id
       LEFT JOIN driver_profiles dp ON u.id = dp.user_id
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Ride not found', 404);
    }

    const ride = result.rows[0];

    const bidsResult = await query(
      `SELECT b.*, u.first_name, u.last_name, u.trust_score
       FROM bids b JOIN users u ON b.bidder_id = u.id
       WHERE b.ride_id = $1 ORDER BY b.created_at DESC`,
      [req.params.id]
    );

    const bookingsResult = await query(
      `SELECT COUNT(*) as total_booked, SUM(seats_booked) as seats_taken
       FROM bookings WHERE ride_id = $1 AND status != 'cancelled'`,
      [req.params.id]
    );

    const rideData = formatRideWithDriver(ride);
    rideData.vehicle = ride.vehicle_make ? {
      make: ride.vehicle_make,
      model: ride.vehicle_model,
      year: ride.vehicle_year,
      color: ride.vehicle_color,
    } : null;
    rideData.bids = bidsResult.rows.map((b) => ({
      id: b.id,
      bidderId: b.bidder_id,
      bidderName: `${b.first_name} ${b.last_name}`,
      bidderTrustScore: b.trust_score,
      amount: b.amount,
      seatsRequested: b.seats_requested,
      message: b.message,
      status: b.status,
      createdAt: b.created_at,
    }));
    rideData.bookingStats = {
      totalBooked: parseInt(bookingsResult.rows[0].total_booked, 10) || 0,
      seatsTaken: parseInt(bookingsResult.rows[0].seats_taken, 10) || 0,
    };

    res.json({ ride: rideData });
  } catch (err) {
    next(err);
  }
};

const updateRide = async (req, res, next) => {
  try {
    const existing = await query('SELECT * FROM rides WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      throw new AppError('Ride not found', 404);
    }
    if (existing.rows[0].driver_id !== req.user.id) {
      throw new AppError('Not authorized to update this ride', 403);
    }
    if (existing.rows[0].status !== 'active') {
      throw new AppError('Can only update active rides', 400);
    }

    const fields = ['available_seats', 'base_price', 'price_per_seat', 'description', 'departure_time', 'status'];
    const bodyMap = { available_seats: 'availableSeats', base_price: 'basePrice', price_per_seat: 'pricePerSeat', description: 'description', departure_time: 'departureTime', status: 'status' };
    const updates = [];
    const values = [];
    let idx = 1;

    for (const field of fields) {
      const bodyKey = bodyMap[field];
      if (req.body[bodyKey] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        values.push(req.body[bodyKey]);
      }
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    values.push(req.params.id);

    const result = await query(
      `UPDATE rides SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json({ message: 'Ride updated', ride: formatRide(result.rows[0]) });
  } catch (err) {
    next(err);
  }
};

const cancelRide = async (req, res, next) => {
  try {
    const existing = await query('SELECT * FROM rides WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) throw new AppError('Ride not found', 404);
    if (existing.rows[0].driver_id !== req.user.id) throw new AppError('Not authorized', 403);

    await query(`UPDATE rides SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [req.params.id]);
    await query(`UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE ride_id = $1 AND status = 'confirmed'`, [req.params.id]);
    await query(`UPDATE bids SET status = 'rejected', updated_at = NOW() WHERE ride_id = $1 AND status = 'pending'`, [req.params.id]);

    setImmediate(() => recalculateAndSave(req.user.id).catch(() => {}));

    res.json({ message: 'Ride cancelled' });
  } catch (err) {
    next(err);
  }
};

const getMyRides = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM rides WHERE driver_id = $1 ORDER BY departure_time DESC`,
      [req.user.id]
    );
    res.json({ rides: result.rows.map(formatRide) });
  } catch (err) {
    next(err);
  }
};

function formatRide(r) {
  return {
    id: r.id,
    driverId: r.driver_id,
    origin: { address: r.origin_address, lat: r.origin_lat, lng: r.origin_lng },
    destination: { address: r.destination_address, lat: r.destination_lat, lng: r.destination_lng },
    departureTime: r.departure_time,
    estimatedArrival: r.estimated_arrival,
    availableSeats: r.available_seats,
    basePrice: r.base_price,
    pricePerSeat: r.price_per_seat,
    allowBidding: r.allow_bidding,
    minBidPrice: r.min_bid_price,
    description: r.description,
    status: r.status,
    createdAt: r.created_at,
  };
}

function formatRideWithDriver(r) {
  return {
    ...formatRide(r),
    driver: {
      firstName: r.driver_first_name,
      lastName: r.driver_last_name,
      trustScore: r.driver_trust_score,
      totalRatings: r.driver_total_ratings,
    },
  };
}

module.exports = { createRide, getRides, getRideById, updateRide, cancelRide, getMyRides };
