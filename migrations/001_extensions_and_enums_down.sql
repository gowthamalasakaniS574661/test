-- Rollback Migration 001

BEGIN;

DROP TYPE IF EXISTS currency_code;
DROP TYPE IF EXISTS payment_method;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS booking_status;
DROP TYPE IF EXISTS bid_status;
DROP TYPE IF EXISTS ride_request_status;
DROP TYPE IF EXISTS ride_status;
DROP TYPE IF EXISTS vehicle_type;
DROP TYPE IF EXISTS driver_status;
DROP TYPE IF EXISTS user_role;

DROP EXTENSION IF EXISTS "pg_trgm";
DROP EXTENSION IF EXISTS "postgis";
DROP EXTENSION IF EXISTS "uuid-ossp";

COMMIT;
