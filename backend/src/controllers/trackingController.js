const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const driverLocations = new Map();

const updateDriverLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, heading, speed } = req.body;

    const booking = await query(
      `SELECT b.*, r.driver_id FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       WHERE b.id = $1`,
      [id]
    );

    if (booking.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.rows[0].driver_id !== req.user.id) {
      throw new AppError('Only the driver can update location', 403);
    }

    driverLocations.set(id, {
      latitude,
      longitude,
      heading,
      speed,
      timestamp: Date.now(),
    });

    res.json({ message: 'Location updated' });
  } catch (err) {
    next(err);
  }
};

const getDriverLocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await query(
      `SELECT b.*, r.driver_id FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       WHERE b.id = $1`,
      [id]
    );

    if (booking.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const b = booking.rows[0];
    if (b.passenger_id !== req.user.id && b.driver_id !== req.user.id) {
      throw new AppError('Not authorized to view this location', 403);
    }

    const location = driverLocations.get(id);
    if (!location) {
      return res.json({ latitude: null, longitude: null, heading: null, speed: null });
    }

    res.json(location);
  } catch (err) {
    next(err);
  }
};

const startRide = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await query(
      `SELECT b.*, r.driver_id FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       WHERE b.id = $1`,
      [id]
    );

    if (booking.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.rows[0].driver_id !== req.user.id) {
      throw new AppError('Only the driver can start the ride', 403);
    }

    if (booking.rows[0].status !== 'confirmed') {
      throw new AppError('Booking must be confirmed to start', 400);
    }

    await query(
      `UPDATE bookings SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    await query(
      `UPDATE rides SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
      [booking.rows[0].ride_id]
    );

    res.json({ message: 'Ride started' });
  } catch (err) {
    next(err);
  }
};

const getDirections = async (req, res, next) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      throw new AppError('Origin and destination coordinates are required', 400);
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new AppError('Google Maps API key not configured', 500);
    }

    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${originLat},${originLng}` +
      `&destination=${destLat},${destLng}` +
      `&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { updateDriverLocation, getDriverLocation, startRide, getDirections };
