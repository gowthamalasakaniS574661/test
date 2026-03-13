-- Migration 006: Ride Requests Table
-- Riders post requests describing where and when they want to travel.
-- Drivers can browse these and place bids.

BEGIN;

CREATE TABLE ride_requests (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id                    UUID NOT NULL,

    -- Origin
    origin_location             GEOGRAPHY(Point, 4326) NOT NULL,
    origin_address              TEXT NOT NULL,

    -- Destination
    destination_location        GEOGRAPHY(Point, 4326) NOT NULL,
    destination_address         TEXT NOT NULL,

    requested_departure_time    TIMESTAMPTZ NOT NULL,
    flexible_window_min         INTEGER DEFAULT 30,

    seats_needed                SMALLINT NOT NULL DEFAULT 1,
    max_price_per_seat          NUMERIC(10, 2),
    currency                    currency_code NOT NULL DEFAULT 'USD',

    status                      ride_request_status NOT NULL DEFAULT 'open',
    notes                       TEXT,
    expires_at                  TIMESTAMPTZ,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ride_requests_rider FOREIGN KEY (rider_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_ride_requests_seats CHECK (seats_needed >= 1),
    CONSTRAINT chk_ride_requests_price CHECK (
        max_price_per_seat IS NULL OR max_price_per_seat >= 0
    ),
    CONSTRAINT chk_ride_requests_expiry CHECK (
        expires_at IS NULL OR expires_at > created_at
    )
);

CREATE INDEX idx_ride_requests_rider ON ride_requests (rider_id);
CREATE INDEX idx_ride_requests_status ON ride_requests (status);
CREATE INDEX idx_ride_requests_departure ON ride_requests (requested_departure_time);
CREATE INDEX idx_ride_requests_open ON ride_requests (status, requested_departure_time)
    WHERE status = 'open';
CREATE INDEX idx_ride_requests_origin ON ride_requests USING GIST (origin_location);
CREATE INDEX idx_ride_requests_destination ON ride_requests USING GIST (destination_location);
CREATE INDEX idx_ride_requests_expires ON ride_requests (expires_at)
    WHERE expires_at IS NOT NULL AND status = 'open';

CREATE TRIGGER trg_ride_requests_updated_at
    BEFORE UPDATE ON ride_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

COMMIT;
