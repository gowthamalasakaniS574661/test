const addBiddingDeadline = `
  ALTER TABLE ride_requests
    ADD COLUMN IF NOT EXISTS bidding_deadline TIMESTAMP WITH TIME ZONE;

  CREATE INDEX IF NOT EXISTS idx_ride_requests_bidding_deadline
    ON ride_requests(bidding_deadline);
`;

const removeBiddingDeadline = `
  DROP INDEX IF EXISTS idx_ride_requests_bidding_deadline;
  ALTER TABLE ride_requests DROP COLUMN IF EXISTS bidding_deadline;
`;

module.exports = { addBiddingDeadline, removeBiddingDeadline };
