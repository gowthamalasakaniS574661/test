const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, phone, role, trust_score, created_at`,
      [email, passwordHash, firstName, lastName, phone, role]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        trustScore: user.trust_score,
      },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, email, password_hash, first_name, last_name, phone, role, trust_score FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        trustScore: user.trust_score,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role,
              u.profile_image_url, u.is_verified, u.trust_score, u.total_ratings, u.created_at,
              dp.license_number, dp.vehicle_make, dp.vehicle_model, dp.vehicle_year,
              dp.vehicle_color, dp.vehicle_plate, dp.seats_available, dp.is_approved
       FROM users u
       LEFT JOIN driver_profiles dp ON u.id = dp.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];
    const profile = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      profileImageUrl: user.profile_image_url,
      isVerified: user.is_verified,
      trustScore: user.trust_score,
      totalRatings: user.total_ratings,
      createdAt: user.created_at,
    };

    if (user.license_number) {
      profile.driverProfile = {
        licenseNumber: user.license_number,
        vehicleMake: user.vehicle_make,
        vehicleModel: user.vehicle_model,
        vehicleYear: user.vehicle_year,
        vehicleColor: user.vehicle_color,
        vehiclePlate: user.vehicle_plate,
        seatsAvailable: user.seats_available,
        isApproved: user.is_approved,
      };
    }

    res.json({ user: profile });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, profileImageUrl } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (firstName) { updates.push(`first_name = $${idx++}`); values.push(firstName); }
    if (lastName) { updates.push(`last_name = $${idx++}`); values.push(lastName); }
    if (phone) { updates.push(`phone = $${idx++}`); values.push(phone); }
    if (profileImageUrl) { updates.push(`profile_image_url = $${idx++}`); values.push(profileImageUrl); }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.user.id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}
       RETURNING id, email, first_name, last_name, phone, role, trust_score`,
      values
    );

    const user = result.rows[0];
    res.json({
      message: 'Profile updated',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        trustScore: user.trust_score,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateDriverProfile = async (req, res, next) => {
  try {
    const { licenseNumber, vehicleMake, vehicleModel, vehicleYear, vehicleColor, vehiclePlate, seatsAvailable } = req.body;

    const existing = await query('SELECT id FROM driver_profiles WHERE user_id = $1', [req.user.id]);

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO driver_profiles (user_id, license_number, vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_plate, seats_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [req.user.id, licenseNumber, vehicleMake, vehicleModel, vehicleYear, vehicleColor, vehiclePlate, seatsAvailable || 4]
      );
    } else {
      await query(
        `UPDATE driver_profiles SET license_number = COALESCE($1, license_number), vehicle_make = COALESCE($2, vehicle_make),
         vehicle_model = COALESCE($3, vehicle_model), vehicle_year = COALESCE($4, vehicle_year),
         vehicle_color = COALESCE($5, vehicle_color), vehicle_plate = COALESCE($6, vehicle_plate),
         seats_available = COALESCE($7, seats_available), updated_at = NOW() WHERE user_id = $8`,
        [licenseNumber, vehicleMake, vehicleModel, vehicleYear, vehicleColor, vehiclePlate, seatsAvailable, req.user.id]
      );
    }

    res.json({ message: 'Driver profile updated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile, updateProfile, updateDriverProfile };
