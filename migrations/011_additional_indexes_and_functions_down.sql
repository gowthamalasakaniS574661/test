-- Rollback Migration 011

BEGIN;

DROP VIEW IF EXISTS v_driver_earnings;
DROP VIEW IF EXISTS v_active_rides;

DROP TRIGGER IF EXISTS trg_rides_increment_total ON rides;
DROP FUNCTION IF EXISTS increment_driver_total_rides();

DROP TRIGGER IF EXISTS trg_bookings_adjust_seats ON bookings;
DROP FUNCTION IF EXISTS adjust_ride_seats_on_booking();

DROP TRIGGER IF EXISTS trg_ratings_update_driver_avg ON ratings;
DROP FUNCTION IF EXISTS update_driver_rating();

DROP INDEX IF EXISTS idx_ride_requests_browse;
DROP INDEX IF EXISTS idx_bookings_rider_history;
DROP INDEX IF EXISTS idx_payments_driver_earnings;
DROP INDEX IF EXISTS idx_rides_search;

COMMIT;
