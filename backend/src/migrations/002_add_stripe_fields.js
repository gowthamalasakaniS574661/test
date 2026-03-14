const addStripeFields = `
  -- Add Stripe Connect account ID to users
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

  -- Add Stripe-specific fields to payments
  ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS stripe_transfer_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS driver_amount DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

  -- Update payments status check to include 'escrow'
  ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
  ALTER TABLE payments ADD CONSTRAINT payments_status_check
    CHECK (status IN ('pending', 'escrow', 'processing', 'completed', 'failed', 'refunded'));

  -- Index for Stripe lookups
  CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
  CREATE INDEX IF NOT EXISTS idx_users_stripe_account ON users(stripe_account_id);
`;

const removeStripeFields = `
  ALTER TABLE users
    DROP COLUMN IF EXISTS stripe_account_id,
    DROP COLUMN IF EXISTS stripe_customer_id;

  ALTER TABLE payments
    DROP COLUMN IF EXISTS stripe_payment_intent_id,
    DROP COLUMN IF EXISTS stripe_transfer_id,
    DROP COLUMN IF EXISTS platform_fee,
    DROP COLUMN IF EXISTS driver_amount,
    DROP COLUMN IF EXISTS captured_at,
    DROP COLUMN IF EXISTS refunded_at;
`;

module.exports = { addStripeFields, removeStripeFields };
