import http from 'http';
import assert from 'node:assert';
import { app } from '../server.js';
import { connectDB, disconnectDB } from '../utils/db.js';
import { User } from '../models/User.js';

let server;
let baseUrl;
let userToken;
let userObj;
let outsiderToken;
let outsiderObj;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { ...(options.headers || {}) };
  if (!options.isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

async function runIdUploadSafetyTests() {
  console.log('🧪 Starting Private ID Verification & Upload Safety Test Suite...\n');

  try {
    await connectDB();

    // Clean test accounts
    await User.deleteMany({
      email: { $in: ['id.user@test.com', 'id.outsider@test.com'] },
    });

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`📡 Test Server running at ${baseUrl}\n`);
        resolve();
      });
    });

    // 1. Auth Guardrails check
    console.log('Test 1: Upload and ID document endpoints require authentication');
    const unauthSign = await request('/api/upload/sign');
    assert.strictEqual(unauthSign.status, 401, 'Unauthenticated upload sign must return 401');

    const unauthView = await request('/api/users/id-document');
    assert.strictEqual(unauthView.status, 401, 'Unauthenticated ID document access must return 401');
    console.log('  ✅ 401 Unauthorized enforced for both upload sign and document view\n');

    // 2. Register primary user & outsider
    console.log('Test 2: Register test accounts');
    const regUser = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'ID Verification User',
        email: 'id.user@test.com',
        password: 'Password@123',
        phone: '9876543220',
        role: 'passenger',
        organization: 'Campus Org',
      }),
    });
    assert.strictEqual(regUser.status, 201);
    userToken = regUser.data.data.token;
    userObj = regUser.data.data.user;

    const regOutsider = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Outsider Snoop',
        email: 'id.outsider@test.com',
        password: 'Password@123',
        phone: '9876543221',
        role: 'passenger',
        organization: 'Campus Org',
      }),
    });
    assert.strictEqual(regOutsider.status, 201);
    outsiderToken = regOutsider.data.data.token;
    outsiderObj = regOutsider.data.data.user;
    console.log('  ✅ Registered primary user and outsider user\n');

    // 3. Test Cloudinary Signed Upload Signature Endpoint
    console.log('Test 3: Cloudinary signed-upload signature endpoint');
    const signRes = await request('/api/upload/sign', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(signRes.status, 200);
    assert(signRes.data.success);
    assert('isCloudinaryConfigured' in signRes.data.data);
    console.log('  ✅ Upload signing parameters returned successfully\n');

    // 4. Test Multipart Private ID Upload
    console.log('Test 4: Upload ID document (multipart/form-data)');
    const formData = new FormData();
    const fakeImageContent = Buffer.from('FAKE_IMAGE_IDENTITY_CARD_DATA_12345');
    const blob = new Blob([fakeImageContent], { type: 'image/jpeg' });
    formData.append('document', blob, 'student_id_card.jpg');

    const uploadRes = await fetch(`${baseUrl}/api/users/verify/id-document`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    assert.strictEqual(uploadRes.status, 200, `Upload should succeed, got ${uploadRes.status}: ${JSON.stringify(uploadData)}`);
    assert.strictEqual(uploadData.data.verificationStatus.govtId, true, 'govtId must automatically become true upon upload');
    assert(uploadData.data.govtIdDocument, 'govtIdDocument metadata must be returned');
    assert(uploadData.data.govtIdDocument.originalName, 'Original filename must be recorded');
    console.log('  ✅ ID uploaded: verificationStatus.govtId automatically set to true\n');

    // Verify in database
    const dbUser = await User.findById(userObj.id);
    assert.strictEqual(dbUser.verificationStatus.govtId, true);
    assert(dbUser.govtIdDocument.publicId, 'Document publicId must be stored');
    console.log('  ✅ MongoDB User record confirmed verified with private govtIdDocument\n');

    // 5. Strict Privacy Guardrail: Outsider CANNOT access another user's private ID document
    console.log('Test 5: Privacy Guardrail — Outsider access to private ID document MUST be forbidden (403)');
    const outsiderAccessRes = await request(`/api/users/${userObj.id}/id-document`, {
      headers: { Authorization: `Bearer ${outsiderToken}` },
    });
    assert.strictEqual(outsiderAccessRes.status, 403, 'Outsider MUST receive 403 Forbidden');
    console.log('  ✅ Privacy Guardrail Passed: 403 Forbidden strictly returned to outsider\n');

    // 6. Authorized Owner Access: Owner can view their own private ID document
    console.log('Test 6: Authorized Owner can view their private ID document');
    const ownerAccessRes = await fetch(`${baseUrl}/api/users/id-document`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(ownerAccessRes.status, 200, 'Owner access to private document must return 200');
    const cacheHeader = ownerAccessRes.headers.get('cache-control');
    assert(cacheHeader && cacheHeader.includes('private'), 'Cache-Control header must be private');
    const retrievedBuffer = await ownerAccessRes.arrayBuffer();
    assert.strictEqual(retrievedBuffer.byteLength, fakeImageContent.length, 'Retrieved bytes must match uploaded file');
    console.log('  ✅ Owner successfully retrieved private document bytes with private cache headers\n');

    // 7. Delete ID document flow
    console.log('Test 7: Remove ID document and reset verification');
    const deleteRes = await request('/api/users/id-document', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(deleteRes.status, 200);
    assert.strictEqual(deleteRes.data.data.verificationStatus.govtId, false, 'govtId should reset to false on delete');

    // Confirm document is gone (404)
    const viewAfterDelete = await request('/api/users/id-document', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(viewAfterDelete.status, 404, 'Accessing deleted document must return 404');
    console.log('  ✅ Document removed and verificationStatus reset to false\n');

    console.log('🎉 ALL PRIVATE ID VERIFICATION & UPLOAD SAFETY TESTS PASSED!');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
}

runIdUploadSafetyTests().catch((err) => {
  console.error('❌ ID Upload Safety Test Failure:', err);
  process.exit(1);
});
