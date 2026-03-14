const addRemainingTables = `
  -- Separate vehicles table
  CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    color VARCHAR(50),
    plate VARCHAR(20),
    seats INTEGER DEFAULT 4 CHECK (seats > 0),
    is_primary BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id);

  -- Route-based advertising
  CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    placement VARCHAR(30) DEFAULT 'search'
      CHECK (placement IN ('search', 'driver_dashboard', 'destination', 'tracking', 'all')),
    route_origin_lat DECIMAL(10,7),
    route_origin_lng DECIMAL(10,7),
    route_dest_lat DECIMAL(10,7),
    route_dest_lng DECIMAL(10,7),
    route_radius_km INTEGER DEFAULT 50,
    budget_cents INTEGER DEFAULT 0,
    spent_cents INTEGER DEFAULT 0,
    cost_per_impression_cents INTEGER DEFAULT 1,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active, placement);

  -- User reports
  CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    ride_id UUID REFERENCES rides(id),
    reason VARCHAR(50) NOT NULL
      CHECK (reason IN ('harassment', 'unsafe_driving', 'fraud', 'no_show', 'inappropriate', 'spam', 'other')),
    description TEXT,
    evidence_urls TEXT[],
    status VARCHAR(20) DEFAULT 'open'
      CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_user_id);

  -- In-app notifications
  CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL
      CHECK (type IN ('bid_received', 'bid_accepted', 'bid_rejected', 'booking_confirmed',
                       'ride_started', 'ride_completed', 'payment_received', 'payment_failed',
                       'rating_received', 'document_approved', 'document_rejected',
                       'sos_alert', 'cancellation', 'admin_message', 'promo')),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

  -- Cancellation policies
  CREATE TABLE IF NOT EXISTS cancellation_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    free_cancel_minutes INTEGER DEFAULT 60,
    penalty_percent INTEGER DEFAULT 10,
    driver_penalty_percent INTEGER DEFAULT 0,
    min_rides_for_penalty INTEGER DEFAULT 3,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  INSERT INTO cancellation_policies (name, description, free_cancel_minutes, penalty_percent, is_default, is_active)
  VALUES ('Standard', 'Free cancellation up to 1 hour before departure. 10% fee after.', 60, 10, TRUE, TRUE)
  ON CONFLICT DO NOTHING;

  -- Add admin role and is_suspended to users
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('driver', 'passenger', 'both', 'admin'));
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
`;

const removeRemainingTables = `
  DROP TABLE IF EXISTS cancellation_policies CASCADE;
  DROP TABLE IF EXISTS notifications CASCADE;
  DROP TABLE IF EXISTS reports CASCADE;
  DROP TABLE IF EXISTS ads CASCADE;
  DROP TABLE IF EXISTS vehicles CASCADE;
  ALTER TABLE users DROP COLUMN IF EXISTS is_suspended;
  ALTER TABLE users DROP COLUMN IF EXISTS suspended_reason;
`;

module.exports = { addRemainingTables, removeRemainingTables };
