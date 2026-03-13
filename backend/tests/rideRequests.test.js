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

describe('POST /api/v1/ride-requests', () => {
  const validPayload = {
    originAddress: '123 Main St',
    originLat: 37.7749,
    originLng: -122.4194,
    destinationAddress: '456 Oak Ave',
    destinationLat: 37.3382,
    destinationLng: -121.8863,
    desiredDeparture: new Date(Date.now() + 86400000).toISOString(),
    maxPrice: 50.00,
    description: 'Need a ride to work',
  };

  it('should create a ride request for a passenger', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          origin_address: validPayload.originAddress,
          origin_lat: validPayload.originLat,
          origin_lng: validPayload.originLng,
          destination_address: validPayload.destinationAddress,
          destination_lat: validPayload.destinationLat,
          destination_lng: validPayload.destinationLng,
          desired_departure: validPayload.desiredDeparture,
          flexibility_minutes: 30,
          seats_needed: 1,
          max_price: '50.00',
          bidding_deadline: null,
          description: validPayload.description,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

    const res = await request(app)
      .post('/api/v1/ride-requests')
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.rideRequest).toBeDefined();
    expect(res.body.rideRequest.origin.address).toBe(validPayload.originAddress);
    expect(res.body.rideRequest.destination.address).toBe(validPayload.destinationAddress);
    expect(res.body.rideRequest.maxPrice).toBe('50.00');
    expect(res.body.rideRequest.status).toBe('open');
  });

  it('should create a ride request with bidding deadline', async () => {
    const deadline = new Date(Date.now() + 43200000).toISOString();
    const payload = { ...validPayload, biddingDeadline: deadline };

    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          origin_address: payload.originAddress,
          origin_lat: payload.originLat,
          origin_lng: payload.originLng,
          destination_address: payload.destinationAddress,
          destination_lat: payload.destinationLat,
          destination_lng: payload.destinationLng,
          desired_departure: payload.desiredDeparture,
          flexibility_minutes: 30,
          seats_needed: 1,
          max_price: '50.00',
          bidding_deadline: deadline,
          description: payload.description,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

    const res = await request(app)
      .post('/api/v1/ride-requests')
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.rideRequest.biddingDeadline).toBe(deadline);
  });

  it('should reject ride request with past bidding deadline', async () => {
    const pastDeadline = new Date(Date.now() - 3600000).toISOString();
    const payload = { ...validPayload, biddingDeadline: pastDeadline };

    query.mockResolvedValueOnce(mockUserLookup(mockUsers.passenger));

    const res = await request(app)
      .post('/api/v1/ride-requests')
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Bidding deadline must be in the future');
  });

  it('should reject ride request with deadline after departure', async () => {
    const departure = new Date(Date.now() + 86400000).toISOString();
    const deadlineAfterDeparture = new Date(Date.now() + 172800000).toISOString();
    const payload = {
      ...validPayload,
      desiredDeparture: departure,
      biddingDeadline: deadlineAfterDeparture,
    };

    query.mockResolvedValueOnce(mockUserLookup(mockUsers.passenger));

    const res = await request(app)
      .post('/api/v1/ride-requests')
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('before the departure time');
  });

  it('should reject without authentication', async () => {
    const res = await request(app)
      .post('/api/v1/ride-requests')
      .send(validPayload);

    expect(res.status).toBe(401);
  });

  it('should reject driver-only role creating ride requests', async () => {
    query.mockResolvedValueOnce(mockUserLookup(mockUsers.driver));

    const res = await request(app)
      .post('/api/v1/ride-requests')
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send(validPayload);

    expect(res.status).toBe(403);
  });

  it('should allow both-role user to create ride requests', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.both))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.both.id,
          origin_address: validPayload.originAddress,
          origin_lat: validPayload.originLat,
          origin_lng: validPayload.originLng,
          destination_address: validPayload.destinationAddress,
          destination_lat: validPayload.destinationLat,
          destination_lng: validPayload.destinationLng,
          desired_departure: validPayload.desiredDeparture,
          flexibility_minutes: 30,
          seats_needed: 1,
          max_price: '50.00',
          bidding_deadline: null,
          description: validPayload.description,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

    const res = await request(app)
      .post('/api/v1/ride-requests')
      .set('Authorization', `Bearer ${mockTokens.both}`)
      .send(validPayload);

    expect(res.status).toBe(201);
  });

  it('should validate required fields', async () => {
    query.mockResolvedValueOnce(mockUserLookup(mockUsers.passenger));

    const res = await request(app)
      .post('/api/v1/ride-requests')
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});

describe('PUT /api/v1/ride-requests/:id', () => {
  it('should update a ride request', async () => {
    const existingRequest = {
      id: requestId,
      passenger_id: mockUsers.passenger.id,
      status: 'open',
      desired_departure: new Date(Date.now() + 86400000).toISOString(),
    };

    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({ rows: [existingRequest] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({
        rows: [{
          ...existingRequest,
          origin_address: 'Updated Address',
          origin_lat: null,
          origin_lng: null,
          destination_address: 'Updated Dest',
          destination_lat: null,
          destination_lng: null,
          flexibility_minutes: 30,
          seats_needed: 1,
          max_price: '75.00',
          bidding_deadline: null,
          description: null,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }],
      });

    const res = await request(app)
      .put(`/api/v1/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send({ maxPrice: 75.00 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Ride request updated');
  });

  it('should reject update of non-open request', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'matched',
        }],
      });

    const res = await request(app)
      .put(`/api/v1/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send({ maxPrice: 75.00 });

    expect(res.status).toBe(400);
  });

  it('should reject update by non-owner', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.both))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'open',
        }],
      });

    const res = await request(app)
      .put(`/api/v1/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.both}`)
      .send({ maxPrice: 75.00 });

    expect(res.status).toBe(403);
  });

  it('should reject update when pending bids exist', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'open',
        }],
      })
      .mockResolvedValueOnce({ rows: [{ count: '2' }] });

    const res = await request(app)
      .put(`/api/v1/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send({ maxPrice: 75.00 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('pending bids');
  });
});

describe('GET /api/v1/ride-requests', () => {
  it('should list open ride requests with bid count and bidding status', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          origin_address: '123 Main St',
          origin_lat: 37.77,
          origin_lng: -122.41,
          destination_address: '456 Oak',
          destination_lat: 37.33,
          destination_lng: -121.88,
          desired_departure: new Date(Date.now() + 86400000).toISOString(),
          flexibility_minutes: 30,
          seats_needed: 1,
          max_price: '50.00',
          bidding_deadline: null,
          description: null,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          first_name: 'Test',
          last_name: 'Passenger',
          trust_score: '4.50',
          bid_count: '3',
        }],
      });

    const res = await request(app)
      .get('/api/v1/ride-requests')
      .set('Authorization', `Bearer ${mockTokens.driver}`);

    expect(res.status).toBe(200);
    expect(res.body.rideRequests).toHaveLength(1);
    expect(res.body.rideRequests[0].bidCount).toBe(3);
    expect(res.body.rideRequests[0].biddingOpen).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(1);
  });

  it('should show biddingOpen as false when deadline has passed', async () => {
    const pastDeadline = new Date(Date.now() - 3600000).toISOString();

    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          origin_address: '123 Main',
          origin_lat: null, origin_lng: null,
          destination_address: '456 Oak',
          destination_lat: null, destination_lng: null,
          desired_departure: new Date(Date.now() + 86400000).toISOString(),
          flexibility_minutes: 30,
          seats_needed: 1,
          max_price: '50.00',
          bidding_deadline: pastDeadline,
          description: null,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          first_name: 'Test',
          last_name: 'Passenger',
          trust_score: '4.50',
          bid_count: '0',
        }],
      });

    const res = await request(app)
      .get('/api/v1/ride-requests')
      .set('Authorization', `Bearer ${mockTokens.driver}`);

    expect(res.status).toBe(200);
    expect(res.body.rideRequests[0].biddingOpen).toBe(false);
  });
});

describe('GET /api/v1/ride-requests/:id', () => {
  it('should return ride request details with bids', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          origin_address: '123 Main',
          origin_lat: null, origin_lng: null,
          destination_address: '456 Oak',
          destination_lat: null, destination_lng: null,
          desired_departure: new Date(Date.now() + 86400000).toISOString(),
          flexibility_minutes: 30,
          seats_needed: 1,
          max_price: '50.00',
          bidding_deadline: null,
          description: null,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          first_name: 'Test',
          last_name: 'Passenger',
          trust_score: '4.50',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: testIds.bid,
          bidder_id: mockUsers.driver.id,
          first_name: 'Test',
          last_name: 'Driver',
          trust_score: '4.80',
          amount: '35.00',
          seats_requested: 1,
          message: 'I can drive you',
          status: 'pending',
          created_at: new Date().toISOString(),
        }],
      });

    const res = await request(app)
      .get(`/api/v1/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.driver}`);

    expect(res.status).toBe(200);
    expect(res.body.rideRequest.bids).toHaveLength(1);
    expect(res.body.rideRequest.bids[0].bidderName).toBe('Test Driver');
    expect(res.body.rideRequest.biddingOpen).toBe(true);
  });

  it('should return 404 for non-existent request', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get(`/api/v1/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.driver}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/ride-requests/my', () => {
  it('should return passenger own requests with bid count', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          origin_address: '123 Main',
          origin_lat: null, origin_lng: null,
          destination_address: '456 Oak',
          destination_lat: null, destination_lng: null,
          desired_departure: new Date(Date.now() + 86400000).toISOString(),
          flexibility_minutes: 30,
          seats_needed: 1,
          max_price: '50.00',
          bidding_deadline: null,
          description: null,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bid_count: '2',
        }],
      });

    const res = await request(app)
      .get('/api/v1/ride-requests/my')
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    expect(res.body.rideRequests).toHaveLength(1);
    expect(res.body.rideRequests[0].bidCount).toBe(2);
  });
});

describe('POST /api/v1/ride-requests/:id/cancel', () => {
  it('should cancel a ride request and reject pending bids', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'open',
        }],
      })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 2 });

    const res = await request(app)
      .post(`/api/v1/ride-requests/${requestId}/cancel`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Ride request cancelled');
  });

  it('should reject cancellation by non-owner', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'open',
        }],
      });

    const res = await request(app)
      .post(`/api/v1/ride-requests/${requestId}/cancel`)
      .set('Authorization', `Bearer ${mockTokens.driver}`);

    expect(res.status).toBe(403);
  });

  it('should reject cancelling already cancelled request', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'cancelled',
        }],
      });

    const res = await request(app)
      .post(`/api/v1/ride-requests/${requestId}/cancel`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(400);
  });
});
