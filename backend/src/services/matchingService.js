const config = require('../config');

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula: computes the great-circle distance between two
 * latitude/longitude points on the Earth's surface, in kilometres.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Normalises a value to [0, 1] using min-max scaling.
 * When `invert` is true the mapping is reversed (lower raw values yield
 * higher normalised scores) — useful for bid price and distance.
 */
function normalise(value, min, max, invert = false) {
  if (max === min) return 1;
  const ratio = (value - min) / (max - min);
  return invert ? 1 - ratio : ratio;
}

/**
 * Computes a composite score for each driver bid, then returns the bids
 * sorted from best to worst match for the passenger.
 *
 * Each bid is scored on four dimensions:
 *   1. bid price        — lower is better  (normalised, inverted)
 *   2. driver rating    — higher is better  (normalised, 1-5 scale)
 *   3. distance         — closer is better  (normalised, inverted)
 *   4. trust score      — higher is better  (normalised, 0-5 scale)
 *
 * The configurable weights (summing to 1.0) are sourced from
 * `config.matching.weights`.
 */
function rankDrivers(bids, pickupLat, pickupLng, weights) {
  const w = weights || config.matching.weights;

  if (!bids || bids.length === 0) return [];

  const enriched = bids.map((bid) => {
    const distanceKm =
      bid.driverLat != null && bid.driverLng != null && pickupLat != null && pickupLng != null
        ? haversineDistance(pickupLat, pickupLng, bid.driverLat, bid.driverLng)
        : null;

    return { ...bid, distanceKm };
  });

  const amounts = enriched.map((b) => parseFloat(b.amount));
  const ratings = enriched.map((b) => parseFloat(b.driverRating || 0));
  const distances = enriched.filter((b) => b.distanceKm !== null).map((b) => b.distanceKm);
  const trusts = enriched.map((b) => parseFloat(b.trustScore || 0));

  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const minDist = distances.length > 0 ? Math.min(...distances) : 0;
  const maxDist = distances.length > 0 ? Math.max(...distances) : 0;
  const minTrust = Math.min(...trusts);
  const maxTrust = Math.max(...trusts);

  const scored = enriched.map((bid) => {
    const bidPriceScore = normalise(parseFloat(bid.amount), minAmount, maxAmount, true);
    const ratingScore = normalise(parseFloat(bid.driverRating || 0), minRating, maxRating, false);
    const distanceScore =
      bid.distanceKm !== null
        ? normalise(bid.distanceKm, minDist, maxDist, true)
        : 0.5;
    const trustScoreNorm = normalise(parseFloat(bid.trustScore || 0), minTrust, maxTrust, false);

    const distWeight = bid.distanceKm !== null ? w.distance : 0;
    const totalWeight = w.bidPrice + w.driverRating + distWeight + w.trustScore;

    const compositeScore =
      (w.bidPrice * bidPriceScore +
        w.driverRating * ratingScore +
        distWeight * distanceScore +
        w.trustScore * trustScoreNorm) /
      totalWeight;

    return {
      ...bid,
      scores: {
        bidPrice: Math.round(bidPriceScore * 1000) / 1000,
        driverRating: Math.round(ratingScore * 1000) / 1000,
        distance: Math.round(distanceScore * 1000) / 1000,
        trustScore: Math.round(trustScoreNorm * 1000) / 1000,
        composite: Math.round(compositeScore * 1000) / 1000,
      },
    };
  });

  scored.sort((a, b) => b.scores.composite - a.scores.composite);

  return scored;
}

module.exports = { rankDrivers, haversineDistance, normalise };
