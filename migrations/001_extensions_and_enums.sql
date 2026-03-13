-- Migration 001: Extensions and Enum Types
-- Enable required extensions and define all enum types used across tables.

BEGIN;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Geospatial support for coordinate-based queries
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Trigram index support for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- Enum types
-- ============================================================

CREATE TYPE user_role AS ENUM ('rider', 'driver', 'admin');

CREATE TYPE driver_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');

CREATE TYPE vehicle_type AS ENUM ('sedan', 'suv', 'van', 'hatchback', 'truck', 'luxury');

CREATE TYPE ride_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

CREATE TYPE ride_request_status AS ENUM ('open', 'matched', 'closed', 'cancelled', 'expired');

CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');

CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled_by_rider', 'cancelled_by_driver', 'completed', 'no_show');

CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');

CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'wallet', 'bank_transfer', 'cash');

CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD');

COMMIT;
