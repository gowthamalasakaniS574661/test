-- Migration 003: Drivers Table
-- Driver profiles linked to user accounts. A user with role 'driver' must have
-- exactly one corresponding driver record.

BEGIN;

CREATE TABLE drivers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL,
    license_number      VARCHAR(50) NOT NULL,
    license_expiry      DATE NOT NULL,
    status              driver_status NOT NULL DEFAULT 'pending',
    rating_avg          NUMERIC(3, 2) DEFAULT 0.00,
    total_rides         INTEGER NOT NULL DEFAULT 0,
    bio                 TEXT,
    is_available        BOOLEAN NOT NULL DEFAULT FALSE,
    current_location    GEOGRAPHY(Point, 4326),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_drivers_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_drivers_user UNIQUE (user_id),
    CONSTRAINT uq_drivers_license UNIQUE (license_number),
    CONSTRAINT chk_drivers_rating CHECK (rating_avg >= 0 AND rating_avg <= 5)
);

CREATE INDEX idx_drivers_status ON drivers (status);
CREATE INDEX idx_drivers_available ON drivers (is_available) WHERE is_available = TRUE;
CREATE INDEX idx_drivers_rating ON drivers (rating_avg DESC);
CREATE INDEX idx_drivers_location ON drivers USING GIST (current_location);

CREATE TRIGGER trg_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

COMMIT;
