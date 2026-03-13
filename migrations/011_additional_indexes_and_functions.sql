-- Migration 011: Additional composite indexes, helper functions, and views
-- Performance-oriented indexes for common query patterns and utility functions.

BEGIN;

-- ============================================================
-- Composite indexes for common query patterns
-- ============================================================

-- Find active rides near a location departing soon
CREATE INDEX idx_rides_search ON rides (status, departure_time, available_seats)
    WHERE status = 'scheduled' AND available_seats > 0;

-- Driver earnings within a date range
CREATE INDEX idx_payments_driver_earnings ON payments (payee_id, paid_at, driver_payout)
    WHERE status = 'completed';

-- Rider booking history
CREATE INDEX idx_bookings_rider_history ON bookings (rider_id, booked_at DESC);

-- Open ride requests sorted by departure time
CREATE INDEX idx_ride_requests_browse ON ride_requests (requested_departure_time, seats_needed)
    WHERE status = 'open';

-- ============================================================
-- Helper function: Update driver average rating
-- ============================================================

CREATE OR REPLACE FUNCTION update_driver_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_driver_user_id UUID;
    v_driver_id UUID;
BEGIN
    SELECT d.id INTO v_driver_id
    FROM drivers d
    WHERE d.user_id = NEW.ratee_id;

    IF v_driver_id IS NOT NULL THEN
        UPDATE drivers
        SET rating_avg = (
            SELECT COALESCE(AVG(r.score), 0)
            FROM ratings r
            WHERE r.ratee_id = NEW.ratee_id
        )
        WHERE id = v_driver_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ratings_update_driver_avg
    AFTER INSERT ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_rating();

-- ============================================================
-- Helper function: Decrement available seats on booking
-- ============================================================

CREATE OR REPLACE FUNCTION adjust_ride_seats_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        UPDATE rides
        SET available_seats = available_seats - NEW.seats_booked
        WHERE id = NEW.ride_id
          AND available_seats >= NEW.seats_booked;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Not enough available seats for ride %', NEW.ride_id;
        END IF;
    END IF;

    IF TG_OP = 'UPDATE'
       AND OLD.status = 'confirmed'
       AND NEW.status IN ('cancelled_by_rider', 'cancelled_by_driver') THEN
        UPDATE rides
        SET available_seats = available_seats + OLD.seats_booked
        WHERE id = OLD.ride_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_adjust_seats
    AFTER INSERT OR UPDATE OF status ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION adjust_ride_seats_on_booking();

-- ============================================================
-- Helper function: Increment driver total_rides on completion
-- ============================================================

CREATE OR REPLACE FUNCTION increment_driver_total_rides()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE drivers
        SET total_rides = total_rides + 1
        WHERE id = NEW.driver_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rides_increment_total
    AFTER UPDATE OF status ON rides
    FOR EACH ROW
    EXECUTE FUNCTION increment_driver_total_rides();

-- ============================================================
-- Useful views
-- ============================================================

CREATE OR REPLACE VIEW v_active_rides AS
SELECT
    r.id,
    r.driver_id,
    u.first_name || ' ' || u.last_name AS driver_name,
    d.rating_avg AS driver_rating,
    v.make || ' ' || v.model AS vehicle,
    v.vehicle_type,
    v.color AS vehicle_color,
    r.origin_address,
    r.destination_address,
    r.departure_time,
    r.estimated_arrival_time,
    r.available_seats,
    r.price_per_seat,
    r.currency,
    r.description
FROM rides r
JOIN drivers d ON d.id = r.driver_id
JOIN users u ON u.id = d.user_id
JOIN vehicles v ON v.id = r.vehicle_id
WHERE r.status = 'scheduled'
  AND r.available_seats > 0
  AND r.departure_time > NOW();

CREATE OR REPLACE VIEW v_driver_earnings AS
SELECT
    p.payee_id AS driver_user_id,
    DATE_TRUNC('month', p.paid_at) AS month,
    COUNT(*) AS total_payments,
    SUM(p.driver_payout) AS total_earnings,
    SUM(p.platform_fee) AS total_fees,
    p.currency
FROM payments p
WHERE p.status = 'completed'
  AND p.paid_at IS NOT NULL
GROUP BY p.payee_id, DATE_TRUNC('month', p.paid_at), p.currency;

COMMIT;
