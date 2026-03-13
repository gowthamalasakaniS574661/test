const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');

let mongod;
let server;
let baseUrl;

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${name}`);
      console.log(`    ${err.message}`);
      failed++;
    }
  }

  console.log('Setting up in-memory MongoDB...\n');
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRES_IN = '1h';

  const connectDB = require('../src/config/db');
  await connectDB();

  const app = require('../src/app');
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  console.log(`Test server running at ${baseUrl}\n`);

  let passengerToken, driverToken;

  // --- Health Check ---
  console.log('Health Check:');
  await test('GET /health returns ok', async () => {
    const res = await request('GET', '/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'ok', 'Expected status ok');
  });

  // --- Signup ---
  console.log('\nSignup:');
  await test('signup passenger succeeds', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'Alice Passenger',
      email: 'alice@example.com',
      password: 'password123',
      role: 'passenger',
    });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.token, 'Expected token in response');
    assert(res.body.user.role === 'passenger', 'Expected role passenger');
    assert(!res.body.user.password, 'Password should not be in response');
    passengerToken = res.body.token;
  });

  await test('signup driver succeeds', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'Bob Driver',
      email: 'bob@example.com',
      password: 'password123',
      role: 'driver',
      phone: '+1234567890',
    });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.user.role === 'driver', 'Expected role driver');
    driverToken = res.body.token;
  });

  await test('signup defaults to passenger role', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'Charlie',
      email: 'charlie@example.com',
      password: 'password123',
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.user.role === 'passenger', 'Expected default role passenger');
  });

  await test('signup with duplicate email returns 409', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'Alice Again',
      email: 'alice@example.com',
      password: 'password456',
    });
    assert(res.status === 409, `Expected 409, got ${res.status}`);
  });

  await test('signup with missing fields returns 400', async () => {
    const res = await request('POST', '/api/auth/signup', {
      email: 'noname@example.com',
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.errors, 'Expected validation errors');
  });

  await test('signup with invalid role returns 400', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'Invalid Role',
      email: 'invalid@example.com',
      password: 'password123',
      role: 'admin',
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await test('signup with short password returns 400', async () => {
    const res = await request('POST', '/api/auth/signup', {
      name: 'Short Pass',
      email: 'short@example.com',
      password: '123',
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // --- Login ---
  console.log('\nLogin:');
  await test('login with valid credentials succeeds', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'password123',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.token, 'Expected token');
    assert(res.body.user.email === 'alice@example.com', 'Expected correct email');
    passengerToken = res.body.token;
  });

  await test('login with wrong password returns 401', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'wrongpassword',
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('login with non-existent email returns 401', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'password123',
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('login with missing fields returns 400', async () => {
    const res = await request('POST', '/api/auth/login', {});
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // --- Protected Routes ---
  console.log('\nProtected Routes:');
  await test('GET /profile without token returns 401', async () => {
    const res = await request('GET', '/api/auth/profile');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('GET /profile with valid token succeeds', async () => {
    const res = await request('GET', '/api/auth/profile', null, passengerToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.user.email === 'alice@example.com', 'Expected correct user');
  });

  await test('GET /profile with invalid token returns 401', async () => {
    const res = await request('GET', '/api/auth/profile', null, 'invalid-token');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // --- Role-Based Access ---
  console.log('\nRole-Based Authorization:');
  await test('passenger can access passenger-only route', async () => {
    const res = await request('GET', '/api/auth/passenger-only', null, passengerToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test('passenger cannot access driver-only route', async () => {
    const res = await request('GET', '/api/auth/driver-only', null, passengerToken);
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('driver can access driver-only route', async () => {
    const res = await request('GET', '/api/auth/driver-only', null, driverToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test('driver cannot access passenger-only route', async () => {
    const res = await request('GET', '/api/auth/passenger-only', null, driverToken);
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  // --- 404 ---
  console.log('\nMiscellaneous:');
  await test('unknown route returns 404', async () => {
    const res = await request('GET', '/api/unknown');
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  // --- Summary ---
  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`========================================\n`);

  server.close();
  await mongoose.disconnect();
  await mongod.stop();

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test setup failed:', err);
  process.exit(1);
});
