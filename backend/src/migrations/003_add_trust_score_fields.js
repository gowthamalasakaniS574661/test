const addTrustScoreFields = `
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS trust_score_updated_at TIMESTAMP WITH TIME ZONE;

  -- Widen trust_score precision to hold the algorithmic result
  ALTER TABLE users
    ALTER COLUMN trust_score TYPE DECIMAL(4,2);
`;

const removeTrustScoreFields = `
  ALTER TABLE users
    DROP COLUMN IF EXISTS trust_score_updated_at;

  ALTER TABLE users
    ALTER COLUMN trust_score TYPE DECIMAL(3,2);
`;

module.exports = { addTrustScoreFields, removeTrustScoreFields };
