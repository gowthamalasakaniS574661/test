require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'rideshare_marketplace',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  matching: {
    weights: {
      bidPrice: parseFloat(process.env.MATCH_WEIGHT_BID_PRICE) || 0.35,
      driverRating: parseFloat(process.env.MATCH_WEIGHT_DRIVER_RATING) || 0.25,
      distance: parseFloat(process.env.MATCH_WEIGHT_DISTANCE) || 0.20,
      trustScore: parseFloat(process.env.MATCH_WEIGHT_TRUST_SCORE) || 0.20,
    },
    maxDistanceKm: parseFloat(process.env.MATCH_MAX_DISTANCE_KM) || 50,
  },
};
