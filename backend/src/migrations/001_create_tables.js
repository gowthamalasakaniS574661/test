const createTables = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  -- Users table (both drivers and passengers)
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('driver', 'passenger', 'both')),
    profile_image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    trust_score DECIMAL(3,2) DEFAULT 5.00 CHECK (trust_score >= 0 AND trust_score <= 5),
    total_ratings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Driver profiles (extended info for drivers)
  CREATE TABLE IF NOT EXISTS driver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_color VARCHAR(50),
    vehicle_plate VARCHAR(20),
    seats_available INTEGER DEFAULT 4 CHECK (seats_available > 0),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
  );

  -- Rides (posted by drivers)
  CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_address TEXT NOT NULL,
    origin_lat DECIMAL(10,7),
    origin_lng DECIMAL(10,7),
    destination_address TEXT NOT NULL,
    destination_lat DECIMAL(10,7),
    destination_lng DECIMAL(10,7),
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    available_seats INTEGER NOT NULL CHECK (available_seats > 0),
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    price_per_seat DECIMAL(10,2) NOT NULL CHECK (price_per_seat >= 0),
    allow_bidding BOOLEAN DEFAULT TRUE,
    min_bid_price DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'full', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Ride requests (from passengers)
  CREATE TABLE IF NOT EXISTS ride_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_address TEXT NOT NULL,
    origin_lat DECIMAL(10,7),
    origin_lng DECIMAL(10,7),
    destination_address TEXT NOT NULL,
    destination_lat DECIMAL(10,7),
    destination_lng DECIMAL(10,7),
    desired_departure TIMESTAMP WITH TIME ZONE NOT NULL,
    flexibility_minutes INTEGER DEFAULT 30,
    seats_needed INTEGER DEFAULT 1 CHECK (seats_needed > 0),
    max_price DECIMAL(10,2),
    description TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'matched', 'booked', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Bids (passengers bid on rides, or drivers bid on requests)
  CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    ride_request_id UUID REFERENCES ride_requests(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    seats_requested INTEGER DEFAULT 1 CHECK (seats_requested > 0),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (ride_id IS NOT NULL OR ride_request_id IS NOT NULL)
  );

  -- Bookings (confirmed rides)
  CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bid_id UUID REFERENCES bids(id),
    seats_booked INTEGER NOT NULL DEFAULT 1 CHECK (seats_booked > 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled', 'disputed')),
    pickup_address TEXT,
    pickup_lat DECIMAL(10,7),
    pickup_lng DECIMAL(10,7),
    dropoff_address TEXT,
    dropoff_lat DECIMAL(10,7),
    dropoff_lng DECIMAL(10,7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Ratings
  CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id, reviewer_id)
  );

  -- Payments (placeholder)
  CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    external_transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
  CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
  CREATE INDEX IF NOT EXISTS idx_rides_departure ON rides(departure_time);
  CREATE INDEX IF NOT EXISTS idx_ride_requests_passenger ON ride_requests(passenger_id);
  CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
  CREATE INDEX IF NOT EXISTS idx_bids_ride ON bids(ride_id);
  CREATE INDEX IF NOT EXISTS idx_bids_request ON bids(ride_request_id);
  CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_ride ON bookings(ride_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON bookings(passenger_id);
  CREATE INDEX IF NOT EXISTS idx_ratings_reviewee ON ratings(reviewee_id);
  CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
`;

const dropTables = `
  DROP TABLE IF EXISTS payments CASCADE;
  DROP TABLE IF EXISTS ratings CASCADE;
  DROP TABLE IF EXISTS bookings CASCADE;
  DROP TABLE IF EXISTS bids CASCADE;
  DROP TABLE IF EXISTS ride_requests CASCADE;
  DROP TABLE IF EXISTS rides CASCADE;
  DROP TABLE IF EXISTS driver_profiles CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
`;

module.exports = { createTables, dropTables };
