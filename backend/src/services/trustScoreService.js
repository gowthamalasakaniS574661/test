const { query } = require('../config/database');

/**
 * Weighted trust score algorithm.
 *
 * Driver factors (weights sum to 1.0):
 *   - completedRides   (0.30) : ratio of completed rides to total rides posted
 *   - ratingAverage    (0.35) : average star rating received
 *   - cancellations    (0.20) : penalty for high cancellation rate
 *   - responseTime     (0.15) : how quickly bids on requests are responded to
 *
 * Passenger factors (weights sum to 1.0):
 *   - rideCompletion   (0.35) : ratio of completed bookings to total bookings
 *   - paymentSuccess   (0.30) : ratio of successful payments to total payments
 *   - ratings          (0.35) : average star rating received
 *
 * All individual factor scores are normalized to 0–5.
 * A Bayesian prior pulls new users toward 3.0 with a confidence
 * parameter so the score becomes more data-driven over time.
 */

const DRIVER_WEIGHTS = {
  completedRides: 0.30,
  ratingAverage: 0.35,
  cancellations: 0.20,
  responseTime: 0.15,
};

const PASSENGER_WEIGHTS = {
  rideCompletion: 0.35,
  paymentSuccess: 0.30,
  ratings: 0.35,
};

const BAYESIAN_PRIOR = 3.0;
const BAYESIAN_CONFIDENCE = 5;

function bayesianAdjust(rawScore, sampleSize) {
  return (BAYESIAN_CONFIDENCE * BAYESIAN_PRIOR + sampleSize * rawScore) /
         (BAYESIAN_CONFIDENCE + sampleSize);
}

async function getDriverFactors(userId) {
  const [ridesRes, ratingsRes, cancelsRes, responseRes] = await Promise.all([
    query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed') AS completed,
         COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
         COUNT(*) AS total
       FROM rides WHERE driver_id = $1`,
      [userId]
    ),
    query(
      `SELECT AVG(score)::NUMERIC(4,2) AS avg_score, COUNT(*) AS total
       FROM ratings WHERE reviewee_id = $1`,
      [userId]
    ),
    query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
         COUNT(*) AS total
       FROM rides WHERE driver_id = $1`,
      [userId]
    ),
    query(
      `SELECT
         AVG(EXTRACT(EPOCH FROM (b.updated_at - b.created_at)))::INTEGER AS avg_response_seconds,
         COUNT(*) AS total
       FROM bids b
       WHERE b.bidder_id = $1
         AND b.ride_request_id IS NOT NULL
         AND b.status IN ('accepted', 'rejected')`,
      [userId]
    ),
  ]);

  const rides = ridesRes.rows[0];
  const ratings = ratingsRes.rows[0];
  const cancels = cancelsRes.rows[0];
  const response = responseRes.rows[0];

  const totalRides = parseInt(rides.total, 10) || 0;
  const completedRides = parseInt(rides.completed, 10) || 0;
  const cancelledRides = parseInt(cancels.cancelled, 10) || 0;
  const avgRating = ratings.avg_score ? parseFloat(ratings.avg_score) : null;
  const totalRatings = parseInt(ratings.total, 10) || 0;
  const avgResponseSeconds = response.avg_response_seconds
    ? parseInt(response.avg_response_seconds, 10)
    : null;
  const totalResponses = parseInt(response.total, 10) || 0;

  const completionRate = totalRides > 0 ? completedRides / totalRides : 0;
  const completionScore = completionRate * 5;

  const ratingScore = avgRating !== null ? avgRating : BAYESIAN_PRIOR;

  const cancellationRate = totalRides > 0 ? cancelledRides / totalRides : 0;
  const cancellationScore = Math.max(0, 5 - cancellationRate * 10);

  let responseScore;
  if (avgResponseSeconds === null || totalResponses === 0) {
    responseScore = BAYESIAN_PRIOR;
  } else {
    const minutes = avgResponseSeconds / 60;
    if (minutes <= 5) responseScore = 5.0;
    else if (minutes <= 15) responseScore = 4.5;
    else if (minutes <= 30) responseScore = 4.0;
    else if (minutes <= 60) responseScore = 3.5;
    else if (minutes <= 120) responseScore = 3.0;
    else if (minutes <= 360) responseScore = 2.0;
    else responseScore = 1.0;
  }

  const rawScore =
    DRIVER_WEIGHTS.completedRides * completionScore +
    DRIVER_WEIGHTS.ratingAverage * ratingScore +
    DRIVER_WEIGHTS.cancellations * cancellationScore +
    DRIVER_WEIGHTS.responseTime * responseScore;

  const sampleSize = totalRides + totalRatings;
  const finalScore = Math.min(5, Math.max(0, bayesianAdjust(rawScore, sampleSize)));

  return {
    score: parseFloat(finalScore.toFixed(2)),
    factors: {
      completedRides: {
        score: parseFloat(completionScore.toFixed(2)),
        weight: DRIVER_WEIGHTS.completedRides,
        completed: completedRides,
        total: totalRides,
        rate: totalRides > 0 ? parseFloat((completionRate * 100).toFixed(1)) : null,
      },
      ratingAverage: {
        score: parseFloat(ratingScore.toFixed(2)),
        weight: DRIVER_WEIGHTS.ratingAverage,
        average: avgRating ? parseFloat(avgRating) : null,
        count: totalRatings,
      },
      cancellations: {
        score: parseFloat(cancellationScore.toFixed(2)),
        weight: DRIVER_WEIGHTS.cancellations,
        cancelled: cancelledRides,
        total: totalRides,
        rate: totalRides > 0 ? parseFloat((cancellationRate * 100).toFixed(1)) : null,
      },
      responseTime: {
        score: parseFloat(responseScore.toFixed(2)),
        weight: DRIVER_WEIGHTS.responseTime,
        avgMinutes: avgResponseSeconds ? parseFloat((avgResponseSeconds / 60).toFixed(1)) : null,
        count: totalResponses,
      },
    },
    sampleSize,
  };
}

async function getPassengerFactors(userId) {
  const [bookingsRes, ratingsRes, paymentsRes] = await Promise.all([
    query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed') AS completed,
         COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
         COUNT(*) AS total
       FROM bookings WHERE passenger_id = $1`,
      [userId]
    ),
    query(
      `SELECT AVG(score)::NUMERIC(4,2) AS avg_score, COUNT(*) AS total
       FROM ratings WHERE reviewee_id = $1`,
      [userId]
    ),
    query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed') AS successful,
         COUNT(*) FILTER (WHERE status = 'failed') AS failed,
         COUNT(*) AS total
       FROM payments WHERE payer_id = $1`,
      [userId]
    ),
  ]);

  const bookings = bookingsRes.rows[0];
  const ratings = ratingsRes.rows[0];
  const payments = paymentsRes.rows[0];

  const totalBookings = parseInt(bookings.total, 10) || 0;
  const completedBookings = parseInt(bookings.completed, 10) || 0;
  const cancelledBookings = parseInt(bookings.cancelled, 10) || 0;
  const avgRating = ratings.avg_score ? parseFloat(ratings.avg_score) : null;
  const totalRatings = parseInt(ratings.total, 10) || 0;
  const totalPayments = parseInt(payments.total, 10) || 0;
  const successfulPayments = parseInt(payments.successful, 10) || 0;
  const failedPayments = parseInt(payments.failed, 10) || 0;

  const completionRate = totalBookings > 0 ? completedBookings / totalBookings : 0;
  const completionScore = completionRate * 5;

  let paymentScore;
  if (totalPayments === 0) {
    paymentScore = BAYESIAN_PRIOR;
  } else {
    const successRate = successfulPayments / totalPayments;
    paymentScore = successRate * 5;
    if (failedPayments > 0) {
      paymentScore = Math.max(0, paymentScore - (failedPayments * 0.5));
    }
  }

  const ratingScore = avgRating !== null ? avgRating : BAYESIAN_PRIOR;

  const rawScore =
    PASSENGER_WEIGHTS.rideCompletion * completionScore +
    PASSENGER_WEIGHTS.paymentSuccess * paymentScore +
    PASSENGER_WEIGHTS.ratings * ratingScore;

  const sampleSize = totalBookings + totalRatings + totalPayments;
  const finalScore = Math.min(5, Math.max(0, bayesianAdjust(rawScore, sampleSize)));

  return {
    score: parseFloat(finalScore.toFixed(2)),
    factors: {
      rideCompletion: {
        score: parseFloat(completionScore.toFixed(2)),
        weight: PASSENGER_WEIGHTS.rideCompletion,
        completed: completedBookings,
        cancelled: cancelledBookings,
        total: totalBookings,
        rate: totalBookings > 0 ? parseFloat((completionRate * 100).toFixed(1)) : null,
      },
      paymentSuccess: {
        score: parseFloat(paymentScore.toFixed(2)),
        weight: PASSENGER_WEIGHTS.paymentSuccess,
        successful: successfulPayments,
        failed: failedPayments,
        total: totalPayments,
      },
      ratings: {
        score: parseFloat(ratingScore.toFixed(2)),
        weight: PASSENGER_WEIGHTS.ratings,
        average: avgRating ? parseFloat(avgRating) : null,
        count: totalRatings,
      },
    },
    sampleSize,
  };
}

async function calculateTrustScore(userId) {
  const userRes = await query('SELECT role FROM users WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) return null;

  const role = userRes.rows[0].role;
  let driverResult = null;
  let passengerResult = null;

  if (role === 'driver' || role === 'both') {
    driverResult = await getDriverFactors(userId);
  }
  if (role === 'passenger' || role === 'both') {
    passengerResult = await getPassengerFactors(userId);
  }

  let overallScore;
  if (driverResult && passengerResult) {
    overallScore = (driverResult.score + passengerResult.score) / 2;
  } else if (driverResult) {
    overallScore = driverResult.score;
  } else {
    overallScore = passengerResult.score;
  }

  overallScore = parseFloat(Math.min(5, Math.max(0, overallScore)).toFixed(2));

  return {
    userId,
    role,
    overallScore,
    driver: driverResult,
    passenger: passengerResult,
  };
}

async function recalculateAndSave(userId) {
  const result = await calculateTrustScore(userId);
  if (!result) return null;

  const totalRatingsRes = await query(
    'SELECT COUNT(*) AS total FROM ratings WHERE reviewee_id = $1',
    [userId]
  );
  const totalRatings = parseInt(totalRatingsRes.rows[0].total, 10) || 0;

  await query(
    `UPDATE users SET
       trust_score = $1,
       total_ratings = $2,
       trust_score_updated_at = NOW(),
       updated_at = NOW()
     WHERE id = $3`,
    [result.overallScore, totalRatings, userId]
  );

  return result;
}

module.exports = {
  calculateTrustScore,
  recalculateAndSave,
  getDriverFactors,
  getPassengerFactors,
};
