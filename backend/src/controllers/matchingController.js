const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { rankDrivers } = require('../services/matchingService');
const config = require('../config');

const getMatchedDrivers = async (req, res, next) => {
  try {
    const requestId = req.params.requestId;

    const requestResult = await query(
      `SELECT rr.*, u.first_name, u.last_name
       FROM ride_requests rr
       JOIN users u ON rr.passenger_id = u.id
       WHERE rr.id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      throw new AppError('Ride request not found', 404);
    }

    const rideRequest = requestResult.rows[0];

    if (rideRequest.passenger_id !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('Not authorized to view matches for this request', 403);
    }

    if (rideRequest.status === 'cancelled') {
      throw new AppError('Cannot match drivers for a cancelled request', 400);
    }

    const bidsResult = await query(
      `SELECT
         b.id AS bid_id,
         b.amount,
         b.seats_requested,
         b.message,
         b.status AS bid_status,
         b.created_at AS bid_created_at,
         u.id AS driver_id,
         u.first_name AS driver_first_name,
         u.last_name AS driver_last_name,
         u.trust_score,
         u.total_ratings,
         u.profile_image_url,
         dp.vehicle_make,
         dp.vehicle_model,
         dp.vehicle_year,
         dp.vehicle_color,
         dp.vehicle_plate,
         dp.seats_available,
         dp.is_approved AS driver_approved
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       LEFT JOIN driver_profiles dp ON dp.user_id = u.id
       WHERE b.ride_request_id = $1
         AND b.status = 'pending'
       ORDER BY b.created_at ASC`,
      [requestId]
    );

    if (bidsResult.rows.length === 0) {
      return res.json({
        rideRequest: formatRequestSummary(rideRequest),
        matches: [],
        totalBids: 0,
      });
    }

    const driverRatings = await loadDriverRatings(
      bidsResult.rows.map((r) => r.driver_id)
    );

    const driverLocations = await loadDriverLocations(
      bidsResult.rows.map((r) => r.driver_id)
    );

    const pickupLat = parseFloat(rideRequest.origin_lat) || null;
    const pickupLng = parseFloat(rideRequest.origin_lng) || null;

    const bids = bidsResult.rows.map((row) => ({
      bidId: row.bid_id,
      amount: row.amount,
      seatsRequested: row.seats_requested,
      message: row.message,
      bidStatus: row.bid_status,
      bidCreatedAt: row.bid_created_at,
      driverId: row.driver_id,
      driverName: `${row.driver_first_name} ${row.driver_last_name}`,
      driverRating: driverRatings[row.driver_id] || parseFloat(row.trust_score) || 3.0,
      trustScore: parseFloat(row.trust_score) || 0,
      totalRatings: row.total_ratings || 0,
      profileImageUrl: row.profile_image_url,
      driverLat: driverLocations[row.driver_id]?.lat ?? null,
      driverLng: driverLocations[row.driver_id]?.lng ?? null,
      vehicle: row.vehicle_make
        ? {
            make: row.vehicle_make,
            model: row.vehicle_model,
            year: row.vehicle_year,
            color: row.vehicle_color,
            plate: row.vehicle_plate,
            seatsAvailable: row.seats_available,
          }
        : null,
      driverApproved: row.driver_approved,
    }));

    const customWeights = parseWeightsFromQuery(req.query);
    const ranked = rankDrivers(bids, pickupLat, pickupLng, customWeights);

    const matches = ranked.map((driver, index) => ({
      rank: index + 1,
      bidId: driver.bidId,
      amount: driver.amount,
      seatsRequested: driver.seatsRequested,
      message: driver.message,
      driver: {
        id: driver.driverId,
        name: driver.driverName,
        rating: driver.driverRating,
        trustScore: driver.trustScore,
        totalRatings: driver.totalRatings,
        profileImageUrl: driver.profileImageUrl,
        approved: driver.driverApproved,
      },
      vehicle: driver.vehicle,
      distanceKm: driver.distanceKm != null ? Math.round(driver.distanceKm * 100) / 100 : null,
      scores: driver.scores,
    }));

    res.json({
      rideRequest: formatRequestSummary(rideRequest),
      matches,
      totalBids: matches.length,
      weights: customWeights || config.matching.weights,
    });
  } catch (err) {
    next(err);
  }
};

async function loadDriverRatings(driverIds) {
  if (driverIds.length === 0) return {};

  const placeholders = driverIds.map((_, i) => `$${i + 1}`).join(',');
  const result = await query(
    `SELECT reviewee_id, AVG(score)::numeric(3,2) AS avg_rating
     FROM ratings
     WHERE reviewee_id IN (${placeholders})
     GROUP BY reviewee_id`,
    driverIds
  );

  const map = {};
  for (const row of result.rows) {
    map[row.reviewee_id] = parseFloat(row.avg_rating);
  }
  return map;
}

async function loadDriverLocations(driverIds) {
  if (driverIds.length === 0) return {};

  const placeholders = driverIds.map((_, i) => `$${i + 1}`).join(',');
  const result = await query(
    `SELECT driver_id, origin_lat AS lat, origin_lng AS lng
     FROM rides
     WHERE driver_id IN (${placeholders})
       AND status = 'active'
     ORDER BY created_at DESC`,
    driverIds
  );

  const map = {};
  for (const row of result.rows) {
    if (!map[row.driver_id]) {
      map[row.driver_id] = {
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
      };
    }
  }
  return map;
}

function parseWeightsFromQuery(queryParams) {
  const { wBidPrice, wDriverRating, wDistance, wTrustScore } = queryParams;
  if (!wBidPrice && !wDriverRating && !wDistance && !wTrustScore) return null;

  return {
    bidPrice: parseFloat(wBidPrice) || config.matching.weights.bidPrice,
    driverRating: parseFloat(wDriverRating) || config.matching.weights.driverRating,
    distance: parseFloat(wDistance) || config.matching.weights.distance,
    trustScore: parseFloat(wTrustScore) || config.matching.weights.trustScore,
  };
}

function formatRequestSummary(r) {
  return {
    id: r.id,
    passengerId: r.passenger_id,
    passengerName: `${r.first_name} ${r.last_name}`,
    origin: { address: r.origin_address, lat: r.origin_lat, lng: r.origin_lng },
    destination: { address: r.destination_address, lat: r.destination_lat, lng: r.destination_lng },
    desiredDeparture: r.desired_departure,
    seatsNeeded: r.seats_needed,
    maxPrice: r.max_price,
    status: r.status,
  };
}

module.exports = { getMatchedDrivers };
