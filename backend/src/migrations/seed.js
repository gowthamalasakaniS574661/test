require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    const passwordHash = await bcrypt.hash('password123', 12);

    await client.query('BEGIN');

    const driverResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified, trust_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['driver@example.com', passwordHash, 'John', 'Driver', '+1234567890', 'driver', true, 4.8]
    );
    const driverId = driverResult.rows[0].id;

    await client.query(
      `INSERT INTO driver_profiles (user_id, license_number, vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_plate, seats_available, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [driverId, 'DL-12345', 'Toyota', 'Camry', 2022, 'Silver', 'ABC-1234', 4, true]
    );

    const passengerResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified, trust_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['passenger@example.com', passwordHash, 'Jane', 'Rider', '+0987654321', 'passenger', true, 4.5]
    );
    const passengerId = passengerResult.rows[0].id;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const rideResult = await client.query(
      `INSERT INTO rides (driver_id, origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng, departure_time, available_seats, base_price, price_per_seat, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [driverId, '123 Main St, Downtown', 40.7128, -74.0060, '456 Oak Ave, Uptown', 40.7589, -73.9851, tomorrow, 3, 25.00, 15.00, 'Morning commute, AC available, comfortable sedan', 'active']
    );

    console.log('Seed data:');
    console.log(`  Driver: driver@example.com / password123 (ID: ${driverId})`);
    console.log(`  Passenger: passenger@example.com / password123 (ID: ${passengerId})`);
    console.log(`  Sample ride: ${rideResult.rows[0].id}`);

    await client.query('COMMIT');
    console.log('Seeding completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
