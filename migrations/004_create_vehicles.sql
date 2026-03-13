-- Migration 004: Vehicles Table
-- Vehicles registered by drivers. A driver may own multiple vehicles but only
-- one can be active at a time (enforced at the application layer).

BEGIN;

CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID NOT NULL,
    make            VARCHAR(50) NOT NULL,
    model           VARCHAR(50) NOT NULL,
    year            INTEGER NOT NULL,
    color           VARCHAR(30) NOT NULL,
    license_plate   VARCHAR(20) NOT NULL,
    vehicle_type    vehicle_type NOT NULL DEFAULT 'sedan',
    capacity        SMALLINT NOT NULL DEFAULT 4,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    insurance_expiry DATE,
    photo_url       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_vehicles_driver FOREIGN KEY (driver_id)
        REFERENCES drivers (id) ON DELETE CASCADE,
    CONSTRAINT uq_vehicles_plate UNIQUE (license_plate),
    CONSTRAINT chk_vehicles_year CHECK (year >= 1990 AND year <= 2100),
    CONSTRAINT chk_vehicles_capacity CHECK (capacity >= 1 AND capacity <= 50)
);

CREATE INDEX idx_vehicles_driver ON vehicles (driver_id);
CREATE INDEX idx_vehicles_type ON vehicles (vehicle_type);
CREATE INDEX idx_vehicles_active ON vehicles (driver_id, is_active) WHERE is_active = TRUE;

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

COMMIT;
