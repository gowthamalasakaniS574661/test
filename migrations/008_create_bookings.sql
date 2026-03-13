-- Migration 008: Bookings Table
-- A booking is created when a rider confirms a seat on a ride, either by
-- directly booking or by accepting a bid.

BEGIN;

CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id         UUID NOT NULL,
    rider_id        UUID NOT NULL,
    bid_id          UUID,

    seats_booked    SMALLINT NOT NULL DEFAULT 1,
    total_price     NUMERIC(10, 2) NOT NULL,
    currency        currency_code NOT NULL DEFAULT 'USD',
    status          booking_status NOT NULL DEFAULT 'confirmed',

    pickup_address  TEXT,
    dropoff_address TEXT,

    booked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at    TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,

    cancellation_reason TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bookings_ride FOREIGN KEY (ride_id)
        REFERENCES rides (id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_rider FOREIGN KEY (rider_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_bid FOREIGN KEY (bid_id)
        REFERENCES bids (id) ON DELETE SET NULL,
    CONSTRAINT chk_bookings_seats CHECK (seats_booked >= 1),
    CONSTRAINT chk_bookings_price CHECK (total_price >= 0),
    CONSTRAINT uq_bookings_rider_ride UNIQUE (rider_id, ride_id)
);

CREATE INDEX idx_bookings_ride ON bookings (ride_id);
CREATE INDEX idx_bookings_rider ON bookings (rider_id);
CREATE INDEX idx_bookings_bid ON bookings (bid_id) WHERE bid_id IS NOT NULL;
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_booked_at ON bookings (booked_at);
CREATE INDEX idx_bookings_active ON bookings (ride_id, status)
    WHERE status = 'confirmed';

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

COMMIT;
