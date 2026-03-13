const request = require('supertest');
const { mockUsers, mockTokens, testIds } = require('./setup');

jest.mock('../src/config/database', () => {
  const mockQuery = jest.fn();
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  return {
    query: mockQuery,
    getClient: jest.fn().mockResolvedValue(mockClient),
    pool: { on: jest.fn() },
  };
});

const { query } = require('../src/config/database');
const app = require('../src/server');

function mockUserLookup(user) {
  return { rows: [user] };
}

beforeEach(() => {
  query.mockReset();
});

const requestId = testIds.rideRequest;

const mockRideRequest = {
  id: requestId,
  passenger_id: mockUsers.passenger.id,
  origin_address: '123 Main St, San Francisco',
  origin_lat: '37.7749',
  origin_lng: '-122.4194',
  destination_address: '456 Oak Ave, San Jose',
  destination_lat: '37.3382',
  destination_lng: '-121.8863',
  desired_departure: new Date(Date.now() + 86400000).toISOString(),
  flexibility_minutes: 30,
  seats_needed: 1,
  max_price: '50.00',
  status: 'open',
  first_name: 'Test',
  last_name: 'Passenger',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockBidsRows = [
  {
    bid_id: testIds.bid1,
    amount: '25.00',
    seats_requested: 1,
    message: 'I can pick you up!',
    bid_status: 'pending',
    bid_created_at: new Date().toISOString(),
    driver_id: mockUsers.driver.id,
    driver_first_name: 'Test',
    driver_last_name: 'Driver',
    trust_score: '4.80',
    total_ratings: 50,
    profile_image_url: null,
    vehicle_make: 'Toyota',
    vehicle_model: 'Camry',
    vehicle_year: 2022,
    vehicle_color: 'Silver',
    vehicle_plate: 'ABC123',
    seats_available: 4,
    driver_approved: true,
  },
  {
    bid_id: testIds.bid2,
    amount: '30.00',
    seats_requested: 1,
    message: 'Happy to help',
    bid_status: 'pending',
    bid_created_at: new Date().toISOString(),
    driver_id: mockUsers.driver2.id,
    driver_first_name: 'Other',
    driver_last_name: 'Driver',
    trust_score: '4.20',
    total_ratings: 30,
    profile_image_url: null,
    vehicle_make: 'Honda',
    vehicle_model: 'Civic',
    vehicle_year: 2021,
    vehicle_color: 'Blue',
    vehicle_plate: 'XYZ789',
    seats_available: 4,
    driver_approved: true,
  },
  {
    bid_id: testIds.bid3,
    amount: '20.00',
    seats_requested: 1,
    message: 'Best price!',
    bid_status: 'pending',
    bid_created_at: new Date().toISOString(),
    driver_id: mockUsers.driver3.id,
    driver_first_name: 'Third',
    driver_last_name: 'Driver',
    trust_score: '3.50',
    total_ratings: 10,
    profile_image_url: null,
    vehicle_make: null,
    vehicle_model: null,
    vehicle_year: null,
    vehicle_color: null,
    vehicle_plate: null,
    seats_available: null,
    driver_approved: null,
  },
];

function setupStandardMocks(user, bids = mockBidsRows) {
  query
    .mockResolvedValueOnce(mockUserLookup(user))
    .mockResolvedValueOnce({ rows: [mockRideRequest] })
    .mockResolvedValueOnce({ rows: bids })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] });
}

describe('GET /api/v1/matching/ride-requests/:requestId', () => {
  it('should return matched drivers sorted by composite score', async () => {
    setupStandardMocks(mockUsers.passenger);

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    expect(res.body.matches).toBeDefined();
    expect(res.body.matches).toHaveLength(3);
    expect(res.body.totalBids).toBe(3);
    expect(res.body.rideRequest).toBeDefined();
    expect(res.body.rideRequest.id).toBe(requestId);
    expect(res.body.weights).toBeDefined();

    for (let i = 0; i < res.body.matches.length - 1; i++) {
      expect(res.body.matches[i].scores.composite).toBeGreaterThanOrEqual(
        res.body.matches[i + 1].scores.composite
      );
    }
  });

  it('should include rank numbers starting from 1', async () => {
    setupStandardMocks(mockUsers.passenger);

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    res.body.matches.forEach((match, index) => {
      expect(match.rank).toBe(index + 1);
    });
  });

  it('should include driver details in each match', async () => {
    setupStandardMocks(mockUsers.passenger);

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    const match = res.body.matches[0];
    expect(match.driver).toBeDefined();
    expect(match.driver.id).toBeDefined();
    expect(match.driver.name).toBeDefined();
    expect(match.driver.rating).toBeDefined();
    expect(match.driver.trustScore).toBeDefined();
    expect(match.amount).toBeDefined();
    expect(match.bidId).toBeDefined();
    expect(match.scores).toBeDefined();
    expect(match.scores.bidPrice).toBeDefined();
    expect(match.scores.driverRating).toBeDefined();
    expect(match.scores.distance).toBeDefined();
    expect(match.scores.trustScore).toBeDefined();
    expect(match.scores.composite).toBeDefined();
  });

  it('should include vehicle info when available', async () => {
    setupStandardMocks(mockUsers.passenger);

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    const withVehicle = res.body.matches.find((m) => m.vehicle !== null);
    expect(withVehicle).toBeDefined();
    expect(withVehicle.vehicle.make).toBeDefined();
    expect(withVehicle.vehicle.model).toBeDefined();

    const withoutVehicle = res.body.matches.find((m) => m.vehicle === null);
    expect(withoutVehicle).toBeDefined();
  });

  it('should return empty matches when no pending bids exist', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({ rows: [mockRideRequest] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    expect(res.body.matches).toEqual([]);
    expect(res.body.totalBids).toBe(0);
  });

  it('should return 404 for non-existent ride request', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Ride request not found');
  });

  it('should return 403 when a different passenger tries to access', async () => {
    const otherRideRequest = {
      ...mockRideRequest,
      passenger_id: '99999999-9999-4999-a999-999999999999',
    };

    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({ rows: [otherRideRequest] });

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Not authorized to view matches for this request');
  });

  it('should return 400 for a cancelled ride request', async () => {
    const cancelledRequest = { ...mockRideRequest, status: 'cancelled' };

    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({ rows: [cancelledRequest] });

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cannot match drivers for a cancelled request');
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  it('should return 400 for invalid request ID format', async () => {
    query.mockResolvedValueOnce(mockUserLookup(mockUsers.passenger));

    const res = await request(app)
      .get('/api/v1/matching/ride-requests/not-a-uuid')
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should accept custom weights via query parameters', async () => {
    setupStandardMocks(mockUsers.passenger);

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .query({ wBidPrice: 0.8, wDriverRating: 0.1, wDistance: 0.05, wTrustScore: 0.05 })
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    expect(res.body.weights).toBeDefined();
    expect(res.body.weights.bidPrice).toBe(0.8);
    expect(res.body.weights.driverRating).toBe(0.1);
  });

  it('should include ride request summary in response', async () => {
    setupStandardMocks(mockUsers.passenger);

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    expect(res.body.rideRequest.id).toBe(requestId);
    expect(res.body.rideRequest.origin).toBeDefined();
    expect(res.body.rideRequest.origin.address).toBe('123 Main St, San Francisco');
    expect(res.body.rideRequest.destination).toBeDefined();
    expect(res.body.rideRequest.passengerName).toBe('Test Passenger');
    expect(res.body.rideRequest.maxPrice).toBe('50.00');
    expect(res.body.rideRequest.status).toBe('open');
  });

  it('should use driver ratings from ratings table when available', async () => {
    const driverRatingsResult = {
      rows: [
        { reviewee_id: mockUsers.driver.id, avg_rating: '4.90' },
        { reviewee_id: mockUsers.driver2.id, avg_rating: '3.50' },
      ],
    };

    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({ rows: [mockRideRequest] })
      .mockResolvedValueOnce({ rows: mockBidsRows })
      .mockResolvedValueOnce(driverRatingsResult)
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(3);
  });

  it('should use driver locations from active rides when available', async () => {
    const driverLocationsResult = {
      rows: [
        { driver_id: mockUsers.driver.id, lat: '37.78', lng: '-122.42' },
        { driver_id: mockUsers.driver2.id, lat: '37.90', lng: '-122.30' },
      ],
    };

    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({ rows: [mockRideRequest] })
      .mockResolvedValueOnce({ rows: mockBidsRows })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(driverLocationsResult);

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    const driverWithLocation = res.body.matches.find(
      (m) => m.driver.id === mockUsers.driver.id
    );
    expect(driverWithLocation.distanceKm).not.toBeNull();
  });

  it('should handle a single bid correctly', async () => {
    setupStandardMocks(mockUsers.passenger, [mockBidsRows[0]]);

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(1);
    expect(res.body.matches[0].rank).toBe(1);
    expect(res.body.matches[0].scores.composite).toBe(1);
  });

  it('should validate weight query parameters are between 0 and 1', async () => {
    query.mockResolvedValueOnce(mockUserLookup(mockUsers.passenger));

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .query({ wBidPrice: 5.0 })
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should work for a user with role "both"', async () => {
    const requestOwnedByBoth = {
      ...mockRideRequest,
      passenger_id: mockUsers.both.id,
    };

    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.both))
      .mockResolvedValueOnce({ rows: [requestOwnedByBoth] })
      .mockResolvedValueOnce({ rows: mockBidsRows })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.both}`);

    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(3);
  });

  it('should include all score dimensions in each match', async () => {
    setupStandardMocks(mockUsers.passenger);

    const res = await request(app)
      .get(`/api/v1/matching/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    res.body.matches.forEach((match) => {
      const { scores } = match;
      expect(typeof scores.bidPrice).toBe('number');
      expect(typeof scores.driverRating).toBe('number');
      expect(typeof scores.distance).toBe('number');
      expect(typeof scores.trustScore).toBe('number');
      expect(typeof scores.composite).toBe('number');
      expect(scores.composite).toBeGreaterThanOrEqual(0);
      expect(scores.composite).toBeLessThanOrEqual(1);
    });
  });
});
