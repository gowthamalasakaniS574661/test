const { query } = require('../config/database');

/**
 * Matching algorithm that ranks drivers for a ride request.
 *
 * Scoring factors (normalized to 0–1, then weighted):
 *   bidPrice     (0.30) — lower bid = higher score
 *   driverRating (0.25) — trust_score / 5
 *   distance     (0.25) — proximity of driver origin to passenger pickup
 *   trustScore   (0.20) — algorithmic trust score / 5
 */

const WEIGHTS = {
  bidPrice: 0.30,
  driverRating: 0.25,
  distance: 0.25,
  trustScore: 0.20,
};

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * (Math.PI / 180); }

async function rankDriversForRequest(rideRequestId) {
  const reqRes = await query(
    `SELECT * FROM ride_requests WHERE id = $1`,
    [rideRequestId]
  );
  if (reqRes.rows.length === 0) return [];
  const request = reqRes.rows[0];

  const bidsRes = await query(
    `SELECT b.*, u.trust_score, u.total_ratings,
            r.origin_lat, r.origin_lng, r.price_per_seat,
            u.first_name, u.last_name
     FROM bids b
     JOIN users u ON b.bidder_id = u.id
     LEFT JOIN rides r ON b.ride_id = r.id
     WHERE b.ride_request_id = $1 AND b.status = 'pending'
     ORDER BY b.created_at`,
    [rideRequestId]
  );

  if (bidsRes.rows.length === 0) return [];

  const bids = bidsRes.rows;
  const amounts = bids.map((b) => parseFloat(b.amount));
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  const amountRange = maxAmount - minAmount || 1;

  const pickupLat = parseFloat(request.origin_lat) || 0;
  const pickupLng = parseFloat(request.origin_lng) || 0;

  const scored = bids.map((bid) => {
    const amount = parseFloat(bid.amount);
    const priceScore = 1 - (amount - minAmount) / amountRange;

    const rating = parseFloat(bid.trust_score) || 3;
    const ratingScore = rating / 5;

    let distanceScore = 0.5;
    if (bid.origin_lat && pickupLat) {
      const dist = haversineKm(pickupLat, pickupLng, parseFloat(bid.origin_lat), parseFloat(bid.origin_lng));
      distanceScore = Math.max(0, 1 - dist / 100);
    }

    const trustScoreVal = parseFloat(bid.trust_score) || 3;
    const trustNorm = trustScoreVal / 5;

    const totalScore =
      WEIGHTS.bidPrice * priceScore +
      WEIGHTS.driverRating * ratingScore +
      WEIGHTS.distance * distanceScore +
      WEIGHTS.trustScore * trustNorm;

    return {
      bidId: bid.id,
      driverId: bid.bidder_id,
      driverName: `${bid.first_name} ${bid.last_name}`,
      amount,
      trustScore: trustScoreVal,
      totalRatings: bid.total_ratings,
      matchScore: parseFloat((totalScore * 100).toFixed(1)),
      factors: {
        priceScore: parseFloat((priceScore * 100).toFixed(1)),
        ratingScore: parseFloat((ratingScore * 100).toFixed(1)),
        distanceScore: parseFloat((distanceScore * 100).toFixed(1)),
        trustScoreNorm: parseFloat((trustNorm * 100).toFixed(1)),
      },
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored;
}

async function findNearbyRides(lat, lng, radiusKm = 25, filters = {}) {
  let whereClause = `WHERE r.status = 'active' AND r.departure_time > NOW()
    AND r.origin_lat IS NOT NULL AND r.origin_lng IS NOT NULL`;
  const values = [];
  let idx = 1;

  if (filters.minSeats) {
    whereClause += ` AND r.available_seats >= $${idx++}`;
    values.push(filters.minSeats);
  }
  if (filters.maxPrice) {
    whereClause += ` AND r.price_per_seat <= $${idx++}`;
    values.push(filters.maxPrice);
  }

  const result = await query(
    `SELECT r.*, u.first_name, u.last_name, u.trust_score, u.total_ratings,
            (6371 * acos(
              LEAST(1, cos(radians($${idx})) * cos(radians(r.origin_lat)) *
              cos(radians(r.origin_lng) - radians($${idx + 1})) +
              sin(radians($${idx})) * sin(radians(r.origin_lat)))
            )) AS distance_km
     FROM rides r
     JOIN users u ON r.driver_id = u.id
     ${whereClause}
     HAVING (6371 * acos(
       LEAST(1, cos(radians($${idx})) * cos(radians(r.origin_lat)) *
       cos(radians(r.origin_lng) - radians($${idx + 1})) +
       sin(radians($${idx})) * sin(radians(r.origin_lat)))
     )) <= $${idx + 2}
     ORDER BY distance_km ASC
     LIMIT 50`,
    [...values, lat, lng, radiusKm]
  );

  return result.rows.map((r) => ({
    id: r.id,
    driverName: `${r.first_name} ${r.last_name}`,
    trustScore: r.trust_score,
    originAddress: r.origin_address,
    destinationAddress: r.destination_address,
    departureTime: r.departure_time,
    availableSeats: r.available_seats,
    pricePerSeat: r.price_per_seat,
    distanceKm: parseFloat(parseFloat(r.distance_km).toFixed(1)),
  }));
}

module.exports = { rankDriversForRequest, findNearbyRides };
