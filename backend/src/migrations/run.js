require('dotenv').config();
const { pool } = require('../config/database');
const { createTables } = require('./001_create_tables');
const { addStripeFields } = require('./002_add_stripe_fields');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    await client.query(createTables);
    console.log('001_create_tables: done');
    await client.query(addStripeFields);
    console.log('002_add_stripe_fields: done');
    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
