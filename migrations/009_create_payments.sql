-- Migration 009: Payments Table
-- Tracks payment transactions for bookings. Supports partial refunds and
-- multiple payment attempts per booking.

BEGIN;

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL,
    payer_id            UUID NOT NULL,
    payee_id            UUID NOT NULL,

    amount              NUMERIC(10, 2) NOT NULL,
    currency            currency_code NOT NULL DEFAULT 'USD',
    payment_method      payment_method NOT NULL,
    status              payment_status NOT NULL DEFAULT 'pending',

    -- External payment processor reference
    transaction_id      VARCHAR(255),
    gateway_response    JSONB,

    platform_fee        NUMERIC(10, 2) DEFAULT 0.00,
    driver_payout       NUMERIC(10, 2),

    paid_at             TIMESTAMPTZ,
    refunded_at         TIMESTAMPTZ,
    refund_amount       NUMERIC(10, 2) DEFAULT 0.00,

    failure_reason      TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id)
        REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_payer FOREIGN KEY (payer_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_payee FOREIGN KEY (payee_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_payments_fee CHECK (platform_fee >= 0),
    CONSTRAINT chk_payments_refund CHECK (refund_amount >= 0 AND refund_amount <= amount),
    CONSTRAINT chk_payments_payout CHECK (driver_payout IS NULL OR driver_payout >= 0)
);

CREATE INDEX idx_payments_booking ON payments (booking_id);
CREATE INDEX idx_payments_payer ON payments (payer_id);
CREATE INDEX idx_payments_payee ON payments (payee_id);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_method ON payments (payment_method);
CREATE INDEX idx_payments_transaction ON payments (transaction_id)
    WHERE transaction_id IS NOT NULL;
CREATE INDEX idx_payments_paid_at ON payments (paid_at)
    WHERE paid_at IS NOT NULL;
CREATE INDEX idx_payments_pending ON payments (created_at)
    WHERE status = 'pending';

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

COMMIT;
