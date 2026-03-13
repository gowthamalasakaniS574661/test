const jwt = require('jsonwebtoken');
const config = require('../src/config');

function generateTestToken(userId, role = 'passenger') {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: '1h' });
}

const mockUsers = {
  passenger: {
    id: '11111111-1111-4111-a111-111111111111',
    email: 'passenger@test.com',
    first_name: 'Test',
    last_name: 'Passenger',
    role: 'passenger',
    trust_score: '4.50',
  },
  driver: {
    id: '22222222-2222-4222-a222-222222222222',
    email: 'driver@test.com',
    first_name: 'Test',
    last_name: 'Driver',
    role: 'driver',
    trust_score: '4.80',
  },
  driver2: {
    id: '33333333-3333-4333-a333-333333333333',
    email: 'driver2@test.com',
    first_name: 'Other',
    last_name: 'Driver',
    role: 'driver',
    trust_score: '4.20',
  },
  driver3: {
    id: '55555555-5555-4555-a555-555555555555',
    email: 'driver3@test.com',
    first_name: 'Third',
    last_name: 'Driver',
    role: 'driver',
    trust_score: '3.50',
  },
  both: {
    id: '44444444-4444-4444-a444-444444444444',
    email: 'both@test.com',
    first_name: 'Multi',
    last_name: 'User',
    role: 'both',
    trust_score: '4.90',
  },
};

const testIds = {
  rideRequest: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  bid1: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb01',
  bid2: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb02',
  bid3: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb03',
  ride: 'cccccccc-cccc-4ccc-accc-cccccccccccc',
};

const mockTokens = {
  passenger: generateTestToken(mockUsers.passenger.id),
  driver: generateTestToken(mockUsers.driver.id),
  driver2: generateTestToken(mockUsers.driver2.id),
  driver3: generateTestToken(mockUsers.driver3.id),
  both: generateTestToken(mockUsers.both.id),
};

module.exports = { generateTestToken, mockUsers, mockTokens, testIds };
