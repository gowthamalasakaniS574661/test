const { query, getClient } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { recalculateAndSave } = require('../services/trustScoreService');

const createRating = async (req, res, next) => {
  const client = await getClient();
  try {
    const { bookingId, score, comment } = req.body;

    await client.query('BEGIN');

    const booking = await client.query(
      `SELECT b.*, r.driver_id FROM bookings b JOIN rides r ON b.ride_id = r.id WHERE b.id = $1`,
      [bookingId]
    );
    if (booking.rows.length === 0) throw new AppError('Booking not found', 404);
    if (booking.rows[0].status !== 'completed') throw new AppError('Can only rate completed bookings', 400);

    const b = booking.rows[0];
    const isPassenger = b.passenger_id === req.user.id;
    const isDriver = b.driver_id === req.user.id;
    if (!isPassenger && !isDriver) throw new AppError('Not authorized to rate this booking', 403);

    const revieweeId = isPassenger ? b.driver_id : b.passenger_id;

    const existing = await client.query(
      'SELECT id FROM ratings WHERE booking_id = $1 AND reviewer_id = $2',
      [bookingId, req.user.id]
    );
    if (existing.rows.length > 0) throw new AppError('You have already rated this booking', 400);

    const result = await client.query(
      `INSERT INTO ratings (booking_id, reviewer_id, reviewee_id, score, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [bookingId, req.user.id, revieweeId, score, comment]
    );

    await client.query('COMMIT');

    setImmediate(() => recalculateAndSave(revieweeId).catch(() => {}));

    res.status(201).json({
      message: 'Rating submitted',
      rating: {
        id: result.rows[0].id,
        bookingId: result.rows[0].booking_id,
        score: result.rows[0].score,
        comment: result.rows[0].comment,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const getUserRatings = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*, u.first_name, u.last_name
       FROM ratings r JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );

    const userResult = await query(
      'SELECT trust_score, total_ratings FROM users WHERE id = $1',
      [req.params.userId]
    );

    if (userResult.rows.length === 0) throw new AppError('User not found', 404);

    res.json({
      trustScore: userResult.rows[0].trust_score,
      totalRatings: userResult.rows[0].total_ratings,
      ratings: result.rows.map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        reviewerName: `${r.first_name} ${r.last_name}`,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createRating, getUserRatings };
