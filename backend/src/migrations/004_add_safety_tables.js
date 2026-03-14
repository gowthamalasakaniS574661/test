const addSafetyTables = `
  -- Driver documents (license, registration, insurance, govt ID)
  CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(30) NOT NULL
      CHECK (document_type IN ('drivers_license', 'vehicle_registration', 'insurance', 'government_id', 'background_check')),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending'
      CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    rejection_reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_driver_docs_user ON driver_documents(user_id);
  CREATE INDEX IF NOT EXISTS idx_driver_docs_status ON driver_documents(status);

  -- Government ID verification records
  CREATE TABLE IF NOT EXISTS id_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_provider VARCHAR(50) DEFAULT 'manual',
    external_verification_id VARCHAR(255),
    id_type VARCHAR(30)
      CHECK (id_type IN ('passport', 'national_id', 'drivers_license', 'other')),
    id_number_hash VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending'
      CHECK (status IN ('pending', 'in_progress', 'verified', 'failed', 'expired')),
    failure_reason TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, id_type)
  );

  CREATE INDEX IF NOT EXISTS idx_id_verifications_user ON id_verifications(user_id);

  -- SOS emergency alerts
  CREATE TABLE IF NOT EXISTS emergency_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    alert_type VARCHAR(20) DEFAULT 'sos'
      CHECK (alert_type IN ('sos', 'safety_concern', 'accident')),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    message TEXT,
    status VARCHAR(20) DEFAULT 'active'
      CHECK (status IN ('active', 'responding', 'resolved', 'false_alarm')),
    emergency_contacts_notified BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user ON emergency_alerts(user_id);
  CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);

  -- Ride share links (for sharing trip with contacts)
  CREATE TABLE IF NOT EXISTS ride_share_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_token VARCHAR(64) NOT NULL UNIQUE,
    recipient_name VARCHAR(100),
    recipient_contact VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    views INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_share_links_token ON ride_share_links(share_token);
  CREATE INDEX IF NOT EXISTS idx_share_links_booking ON ride_share_links(booking_id);

  -- Emergency contacts
  CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id);

  -- Add id_verified flag to users
  ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;
`;

const removeSafetyTables = `
  DROP TABLE IF EXISTS emergency_contacts CASCADE;
  DROP TABLE IF EXISTS ride_share_links CASCADE;
  DROP TABLE IF EXISTS emergency_alerts CASCADE;
  DROP TABLE IF EXISTS id_verifications CASCADE;
  DROP TABLE IF EXISTS driver_documents CASCADE;
  ALTER TABLE users DROP COLUMN IF EXISTS id_verified;
`;

module.exports = { addSafetyTables, removeSafetyTables };
