-- Rollback Migration 008

BEGIN;
DROP TABLE IF EXISTS bookings CASCADE;
COMMIT;
