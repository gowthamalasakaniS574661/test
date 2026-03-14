const { AppError } = require('../middleware/errorHandler');
const { rankDriversForRequest, findNearbyRides } = require('../services/matchingService');

const getRankedDrivers = async (req, res, next) => {
  try {
    const ranked = await rankDriversForRequest(req.params.requestId);
    res.json({ drivers: ranked });
  } catch (err) { next(err); }
};

const getNearbyRides = async (req, res, next) => {
  try {
    const { lat, lng, radius, minSeats, maxPrice } = req.query;
    if (!lat || !lng) throw new AppError('lat and lng are required', 400);
    const rides = await findNearbyRides(
      parseFloat(lat), parseFloat(lng), parseFloat(radius) || 25,
      { minSeats: minSeats ? parseInt(minSeats, 10) : null, maxPrice: maxPrice ? parseFloat(maxPrice) : null }
    );
    res.json({ rides });
  } catch (err) { next(err); }
};

module.exports = { getRankedDrivers, getNearbyRides };
