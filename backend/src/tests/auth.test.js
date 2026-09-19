process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_12345';

import assert from 'assert';
import http from 'http';
import { app } from '../server.js';
import { connectDB, disconnectDB } from '../utils/db.js';
import { User } from '../models/User.js';

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting SmartRide Phase 1 Automated Test Suite...\n');
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret_key_12345';

  await connectDB();
  await User.deleteMany({}); // Clean up any test users

  // Start HTTP server on dynamic port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running on ${baseUrl}\n`);

  try {
    // 1. Health check
    console.log('Test 1: GET /api/health');
    const health = await request('/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.status, 'ok');
    console.log('✅ Health check passed\n');

    // 2. Register valid user
    console.log('Test 2: POST /api/auth/register (valid passenger)');
    const testUserPayload = {
      name: 'Radhika Sharma',
      email: 'radhika@college.edu',
      password: 'StrongPassword123!',
      phone: '+919876543210',
      organization: 'Pune University',
      role: 'passenger',
      preferences: {
        music: true,
        quietRide: false,
        petFriendly: true,
        smoking: false,
      },
    };

    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: testUserPayload,
    });

    assert.strictEqual(regRes.status, 201, `Expected 201 but got ${regRes.status}: ${JSON.stringify(regRes.data)}`);
    assert.strictEqual(regRes.data.success, true);
    assert.ok(regRes.data.data.token, 'Token must be present in response');
    assert.strictEqual(regRes.data.data.user.email, 'radhika@college.edu');
    assert.strictEqual(regRes.data.data.user.role, 'passenger');
    assert.strictEqual(regRes.data.data.user.organization, 'Pune University');
    assert.strictEqual(regRes.data.data.user.passwordHash, undefined, 'passwordHash must never be exposed');
    console.log('✅ Registration passed (Token issued, passwordHash omitted)\n');

    const authToken = regRes.data.data.token;

    // 3. Register duplicate email
    console.log('Test 3: POST /api/auth/register (duplicate email rejection)');
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: testUserPayload,
    });
    assert.strictEqual(dupRes.status, 409, `Expected 409 Conflict but got ${dupRes.status}`);
    assert.strictEqual(dupRes.data.success, false);
    console.log('✅ Duplicate email rejection passed\n');

    // 4. Login with correct credentials
    console.log('Test 4: POST /api/auth/login (valid credentials)');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'radhika@college.edu',
        password: 'StrongPassword123!',
      },
    });
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.data.success, true);
    assert.ok(loginRes.data.data.token);
    assert.strictEqual(loginRes.data.data.user.name, 'Radhika Sharma');
    console.log('✅ Login passed\n');

    // 5. Login with incorrect password
    console.log('Test 5: POST /api/auth/login (wrong password)');
    const wrongPassRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'radhika@college.edu',
        password: 'WrongPassword123!',
      },
    });
    assert.strictEqual(wrongPassRes.status, 401);
    assert.strictEqual(wrongPassRes.data.success, false);
    console.log('✅ Wrong password rejection passed\n');

    // 6. Access protected route without token
    console.log('Test 6: GET /api/auth/me (no token)');
    const noTokenRes = await request('/api/auth/me');
    assert.strictEqual(noTokenRes.status, 401);
    assert.strictEqual(noTokenRes.data.success, false);
    console.log('✅ Unauthenticated access rejection passed\n');

    // 7. Access protected route with valid token
    console.log('Test 7: GET /api/auth/me (with valid Bearer token)');
    const authMeRes = await request('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    assert.strictEqual(authMeRes.status, 200);
    assert.strictEqual(authMeRes.data.success, true);
    assert.strictEqual(authMeRes.data.data.user.name, 'Radhika Sharma');
    assert.strictEqual(authMeRes.data.data.user.email, 'radhika@college.edu');
    assert.strictEqual(authMeRes.data.data.user.preferences.petFriendly, true);
    console.log('✅ Protected route verification passed\n');

    // 8. Register Driver Demo User
    console.log('Test 8: Register Demo Driver');
    const driverPayload = {
      name: 'Amit Verma',
      email: 'driver.demo@smartride.edu',
      password: 'DemoPass123!',
      phone: '+919123456780',
      organization: 'Infosys Hinjewadi',
      role: 'driver',
    };
    const driverRes = await request('/api/auth/register', {
      method: 'POST',
      body: driverPayload,
    });
    assert.strictEqual(driverRes.status, 201);
    assert.strictEqual(driverRes.data.data.user.role, 'driver');
    console.log('✅ Demo Driver registration passed\n');

    console.log('🎉 ALL PHASE 1 TESTS PASSED SUCCESSFULLY!');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
