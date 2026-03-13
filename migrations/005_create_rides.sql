-- Migration 005: Rides Table
-- Rides posted by drivers offering seats on a route. Riders browse and book
-- these, or drivers can receive bids from ride requests.

BEGIN;

CREATE TABLE rides (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id               UUID NOT NULL,
    vehicle_id              UUID NOT NULL,

    -- Origin
    origin_location         GEOGRAPHY(Point, 4326) NOT NULL,
    origin_address          TEXT NOT NULL,

    -- Destination
    destination_location    GEOGRAPHY(Point, 4326) NOT NULL,
    destination_address     TEXT NOT NULL,

    -- Waypoints stored as ordered JSON array of {lat, lng, address}
    waypoints               JSONB DEFAULT '[]'::jsonb,

    departure_time          TIMESTAMPTZ NOT NULL,
    estimated_arrival_time  TIMESTAMPTZ,
    estimated_distance_km   NUMERIC(8, 2),
    estimated_duration_min  INTEGER,

    available_seats         SMALLINT NOT NULL,
    price_per_seat          NUMERIC(10, 2) NOT NULL,
    currency                currency_code NOT NULL DEFAULT 'USD',

    status                  ride_status NOT NULL DEFAULT 'scheduled',
    description             TEXT,
    is_recurring            BOOLEAN NOT NULL DEFAULT FALSE,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rides_driver FOREIGN KEY (driver_id)
        REFERENCES drivers (id) ON DELETE CASCADE,
    CONSTRAINT fk_rides_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (id) ON DELETE SET NULL,
    CONSTRAINT chk_rides_seats CHECK (available_seats >= 0),
    CONSTRAINT chk_rides_price CHECK (price_per_seat >= 0),
    CONSTRAINT chk_rides_arrival CHECK (
        estimated_arrival_time IS NULL
        OR estimated_arrival_time > departure_time
    )
);

CREATE INDEX idx_rides_driver ON rides (driver_id);
CREATE INDEX idx_rides_status ON rides (status);
CREATE INDEX idx_rides_departure ON rides (departure_time);
CREATE INDEX idx_rides_status_departure ON rides (status, departure_time)
    WHERE status = 'scheduled';
CREATE INDEX idx_rides_origin ON rides USING GIST (origin_location);
CREATE INDEX idx_rides_destination ON rides USING GIST (destination_location);
CREATE INDEX idx_rides_price ON rides (price_per_seat);
CREATE INDEX idx_rides_available ON rides (available_seats)
    WHERE available_seats > 0 AND status = 'scheduled';

CREATE TRIGGER trg_rides_updated_at
    BEFORE UPDATE ON rides
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

COMMIT;
