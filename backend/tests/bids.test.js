const request = require('supertest');
const { mockUsers, mockTokens, testIds } = require('./setup');

let mockClientInstance;

jest.mock('../src/config/database', () => {
  const mockQuery = jest.fn();
  mockClientInstance = {
    query: jest.fn(),
    release: jest.fn(),
  };
  return {
    query: mockQuery,
    getClient: jest.fn().mockResolvedValue(mockClientInstance),
    pool: { on: jest.fn() },
  };
});

const { query, getClient } = require('../src/config/database');
const app = require('../src/server');

function mockUserLookup(user) {
  return { rows: [user] };
}

const requestId = testIds.rideRequest;
const bidId = testIds.bid;

beforeEach(() => {
  query.mockReset();
  mockClientInstance.query.mockReset();
  mockClientInstance.release.mockReset();
  getClient.mockResolvedValue(mockClientInstance);
});

describe('POST /api/v1/bids - Create bid on ride request', () => {
  it('should allow a driver to place a bid on a ride request', async () => {
    const openRequest = {
      id: requestId,
      passenger_id: mockUsers.passenger.id,
      status: 'open',
      max_price: '50.00',
      bidding_deadline: null,
    };

    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({ rows: [openRequest] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          ride_id: null,
          ride_request_id: requestId,
          bidder_id: mockUsers.driver.id,
          amount: '35.00',
          seats_requested: 1,
          message: 'I can take you there',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

    const res = await request(app)
      .post('/api/v1/bids')
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send({
        rideRequestId: requestId,
        amount: 35.00,
        message: 'I can take you there',
      });

    expect(res.status).toBe(201);
    expect(res.body.bid.rideRequestId).toBe(requestId);
    expect(res.body.bid.amount).toBe('35.00');
    expect(res.body.bid.status).toBe('pending');
  });

  it('should reject bid on own request', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'open',
          bidding_deadline: null,
        }],
      });

    const res = await request(app)
      .post('/api/v1/bids')
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send({ rideRequestId: requestId, amount: 30.00 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Cannot bid on your own request');
  });

  it('should reject bid after bidding deadline', async () => {
    const pastDeadline = new Date(Date.now() - 3600000).toISOString();

    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'open',
          max_price: '50.00',
          bidding_deadline: pastDeadline,
        }],
      });

    const res = await request(app)
      .post('/api/v1/bids')
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send({ rideRequestId: requestId, amount: 30.00 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Bidding deadline has passed');
  });

  it('should reject bid exceeding max price', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'open',
          max_price: '50.00',
          bidding_deadline: null,
        }],
      });

    const res = await request(app)
      .post('/api/v1/bids')
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send({ rideRequestId: requestId, amount: 75.00 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('cannot exceed the maximum price');
  });

  it('should reject duplicate pending bid', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'open',
          max_price: '50.00',
          bidding_deadline: null,
        }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 'existing-bid' }] });

    const res = await request(app)
      .post('/api/v1/bids')
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send({ rideRequestId: requestId, amount: 30.00 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already have a pending bid');
  });

  it('should reject bid on closed request', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'matched',
          bidding_deadline: null,
        }],
      });

    const res = await request(app)
      .post('/api/v1/bids')
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send({ rideRequestId: requestId, amount: 30.00 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not open');
  });

  it('should reject bid without rideId or rideRequestId', async () => {
    query.mockResolvedValueOnce(mockUserLookup(mockUsers.driver));

    const res = await request(app)
      .post('/api/v1/bids')
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send({ amount: 30.00 });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/v1/bids/:id - Update bid', () => {
  it('should update a pending bid amount', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          bidder_id: mockUsers.driver.id,
          ride_request_id: requestId,
          ride_id: null,
          amount: '35.00',
          status: 'pending',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          max_price: '50.00',
          bidding_deadline: null,
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          ride_id: null,
          ride_request_id: requestId,
          bidder_id: mockUsers.driver.id,
          amount: '40.00',
          seats_requested: 1,
          message: null,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

    const res = await request(app)
      .put(`/api/v1/bids/${bidId}`)
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send({ amount: 40.00 });

    expect(res.status).toBe(200);
    expect(res.body.bid.amount).toBe('40.00');
    expect(res.body.message).toBe('Bid updated');
  });

  it('should update bid message', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          bidder_id: mockUsers.driver.id,
          ride_request_id: requestId,
          ride_id: null,
          status: 'pending',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          max_price: '50.00',
          bidding_deadline: null,
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          ride_id: null,
          ride_request_id: requestId,
          bidder_id: mockUsers.driver.id,
          amount: '35.00',
          seats_requested: 1,
          message: 'Updated message',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

    const res = await request(app)
      .put(`/api/v1/bids/${bidId}`)
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send({ message: 'Updated message' });

    expect(res.status).toBe(200);
    expect(res.body.bid.message).toBe('Updated message');
  });

  it('should reject update of non-pending bid', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          bidder_id: mockUsers.driver.id,
          status: 'accepted',
        }],
      });

    const res = await request(app)
      .put(`/api/v1/bids/${bidId}`)
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send({ amount: 40.00 });

    expect(res.status).toBe(400);
  });

  it('should reject update by non-owner', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver2))
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          bidder_id: mockUsers.driver.id,
          status: 'pending',
        }],
      });

    const res = await request(app)
      .put(`/api/v1/bids/${bidId}`)
      .set('Authorization', `Bearer ${mockTokens.driver2}`)
      .send({ amount: 40.00 });

    expect(res.status).toBe(403);
  });

  it('should reject update after bidding deadline', async () => {
    const pastDeadline = new Date(Date.now() - 3600000).toISOString();

    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          bidder_id: mockUsers.driver.id,
          ride_request_id: requestId,
          ride_id: null,
          status: 'pending',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          max_price: '50.00',
          bidding_deadline: pastDeadline,
        }],
      });

    const res = await request(app)
      .put(`/api/v1/bids/${bidId}`)
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send({ amount: 40.00 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('deadline has passed');
  });

  it('should reject update exceeding max price', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          bidder_id: mockUsers.driver.id,
          ride_request_id: requestId,
          ride_id: null,
          status: 'pending',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          max_price: '50.00',
          bidding_deadline: null,
        }],
      });

    const res = await request(app)
      .put(`/api/v1/bids/${bidId}`)
      .set('Authorization', `Bearer ${mockTokens.driver}`)
      .send({ amount: 75.00 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('cannot exceed');
  });
});

describe('POST /api/v1/bids/:id/withdraw - Withdraw bid', () => {
  it('should withdraw a pending bid', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          bidder_id: mockUsers.driver.id,
          status: 'pending',
        }],
      })
      .mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .post(`/api/v1/bids/${bidId}/withdraw`)
      .set('Authorization', `Bearer ${mockTokens.driver}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Bid withdrawn');
  });

  it('should reject withdrawing non-pending bid', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          bidder_id: mockUsers.driver.id,
          status: 'accepted',
        }],
      });

    const res = await request(app)
      .post(`/api/v1/bids/${bidId}/withdraw`)
      .set('Authorization', `Bearer ${mockTokens.driver}`);

    expect(res.status).toBe(400);
  });

  it('should reject withdrawing someone else bid', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver2))
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          bidder_id: mockUsers.driver.id,
          status: 'pending',
        }],
      });

    const res = await request(app)
      .post(`/api/v1/bids/${bidId}/withdraw`)
      .set('Authorization', `Bearer ${mockTokens.driver2}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/bids/my - Get my bids', () => {
  it('should return driver bids with request details', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.driver))
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          ride_id: null,
          ride_request_id: requestId,
          bidder_id: mockUsers.driver.id,
          amount: '35.00',
          seats_requested: 1,
          message: 'Available',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ride_origin: null,
          ride_destination: null,
          request_origin: '123 Main St',
          request_destination: '456 Oak Ave',
          request_max_price: '50.00',
          request_bidding_deadline: null,
        }],
      });

    const res = await request(app)
      .get('/api/v1/bids/my')
      .set('Authorization', `Bearer ${mockTokens.driver}`);

    expect(res.status).toBe(200);
    expect(res.body.bids).toHaveLength(1);
    expect(res.body.bids[0].requestOrigin).toBe('123 Main St');
    expect(res.body.bids[0].requestMaxPrice).toBe('50.00');
    expect(res.body.bids[0].amount).toBe('35.00');
  });
});

describe('GET /api/v1/bids/request/:requestId - Get bids for request', () => {
  it('should return all bids for a ride request with driver info', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
          status: 'open',
        }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: testIds.bid,
            ride_id: null,
            ride_request_id: requestId,
            bidder_id: mockUsers.driver.id,
            amount: '35.00',
            seats_requested: 1,
            message: 'I can drive you',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            first_name: 'Test',
            last_name: 'Driver',
            trust_score: '4.80',
            vehicle_make: 'Toyota',
            vehicle_model: 'Camry',
            vehicle_year: 2022,
            vehicle_color: 'Blue',
          },
          {
            id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
            ride_id: null,
            ride_request_id: requestId,
            bidder_id: mockUsers.driver2.id,
            amount: '40.00',
            seats_requested: 1,
            message: 'Ready to go',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            first_name: 'Other',
            last_name: 'Driver',
            trust_score: '4.20',
            vehicle_make: null,
            vehicle_model: null,
            vehicle_year: null,
            vehicle_color: null,
          },
        ],
      });

    const res = await request(app)
      .get(`/api/v1/bids/request/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(200);
    expect(res.body.bids).toHaveLength(2);
    expect(res.body.bids[0].bidderName).toBe('Test Driver');
    expect(res.body.bids[0].vehicle).toEqual({
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      color: 'Blue',
    });
    expect(res.body.bids[1].vehicle).toBeNull();
    expect(res.body.bids[1].bidderName).toBe('Other Driver');
  });

  it('should return 404 for non-existent request', async () => {
    query
      .mockResolvedValueOnce(mockUserLookup(mockUsers.passenger))
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get(`/api/v1/bids/request/${requestId}`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/bids/:id/respond - Accept/reject bid', () => {
  it('should accept a bid on a ride request and mark request as matched', async () => {
    query.mockResolvedValueOnce(mockUserLookup(mockUsers.passenger));

    mockClientInstance.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          ride_id: null,
          ride_request_id: requestId,
          bidder_id: mockUsers.driver.id,
          amount: '35.00',
          seats_requested: 1,
          status: 'pending',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
        }],
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const res = await request(app)
      .post(`/api/v1/bids/${bidId}/respond`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send({ action: 'accept' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Bid accepted');
  });

  it('should reject a bid on a ride request', async () => {
    query.mockResolvedValueOnce(mockUserLookup(mockUsers.passenger));

    mockClientInstance.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: bidId,
          ride_id: null,
          ride_request_id: requestId,
          bidder_id: mockUsers.driver.id,
          status: 'pending',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: requestId,
          passenger_id: mockUsers.passenger.id,
        }],
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const res = await request(app)
      .post(`/api/v1/bids/${bidId}/respond`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send({ action: 'reject' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Bid rejected');
  });

  it('should reject invalid action', async () => {
    query.mockResolvedValueOnce(mockUserLookup(mockUsers.passenger));

    const res = await request(app)
      .post(`/api/v1/bids/${bidId}/respond`)
      .set('Authorization', `Bearer ${mockTokens.passenger}`)
      .send({ action: 'invalid' });

    expect(res.status).toBe(400);
  });
});
