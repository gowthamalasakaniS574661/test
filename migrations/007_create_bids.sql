-- Migration 007: Bids Table
-- Drivers bid on ride requests with a proposed price and optional message.
-- A bid may reference an existing ride if the driver already has one going
-- in the same direction.

BEGIN;

CREATE TABLE bids (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_request_id     UUID NOT NULL,
    driver_id           UUID NOT NULL,
    ride_id             UUID,

    proposed_price      NUMERIC(10, 2) NOT NULL,
    currency            currency_code NOT NULL DEFAULT 'USD',
    message             TEXT,
    status              bid_status NOT NULL DEFAULT 'pending',

    expires_at          TIMESTAMPTZ,
    responded_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bids_request FOREIGN KEY (ride_request_id)
        REFERENCES ride_requests (id) ON DELETE CASCADE,
    CONSTRAINT fk_bids_driver FOREIGN KEY (driver_id)
        REFERENCES drivers (id) ON DELETE CASCADE,
    CONSTRAINT fk_bids_ride FOREIGN KEY (ride_id)
        REFERENCES rides (id) ON DELETE SET NULL,
    CONSTRAINT chk_bids_price CHECK (proposed_price >= 0),
    CONSTRAINT uq_bids_driver_request UNIQUE (driver_id, ride_request_id)
);

CREATE INDEX idx_bids_request ON bids (ride_request_id);
CREATE INDEX idx_bids_driver ON bids (driver_id);
CREATE INDEX idx_bids_ride ON bids (ride_id) WHERE ride_id IS NOT NULL;
CREATE INDEX idx_bids_status ON bids (status);
CREATE INDEX idx_bids_pending ON bids (ride_request_id, proposed_price)
    WHERE status = 'pending';

CREATE TRIGGER trg_bids_updated_at
    BEFORE UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

COMMIT;
