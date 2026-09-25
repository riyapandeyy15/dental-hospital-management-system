// End-to-end check of Phase 3 authentication. Covers:
//   1. Admin seed works
//   2. Duplicate admin is not created
//   3. Correct login succeeds
//   4. Incorrect password fails
//   5. Unknown email fails
//   6. JWT is generated
//   7. GET /auth/me works with a valid token
//   8. GET /auth/me fails without a token
//   9. Invalid token is rejected
//  10. requireRole correctly distinguishes ADMIN and DOCTOR
//
// Never prints real passwords or secrets. Uses its own temporary test users
// (separate from your real admin) and cleans them up afterwards.
//
// Run with: npm run verify:auth

const http = require('http');
const { execFileSync } = require('child_process');
const path = require('path');

const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const { hashPassword } = require('../src/modules/auth/auth.service');
const requireRole = require('../src/middleware/role');

const results = [];

function record(name, passed, detail) {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}${detail ? ` (${detail})` : ''}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  await connectDB();

  const testAdminEmail = `verify-auth-admin-${Date.now()}@example.com`;
  const testAdminPassword = 'Verify-Auth-Pass-1!';
  const testDoctorEmail = `verify-auth-doctor-${Date.now()}@example.com`;

  // --- 1 & 2: seed script creates an admin, and skips on a second run ---
  const seedScriptPath = path.join(__dirname, 'seedAdmin.js');
  const seedEnv = {
    ...process.env,
    SEED_ADMIN_NAME: 'Verify Auth Admin',
    SEED_ADMIN_EMAIL: testAdminEmail,
    SEED_ADMIN_PASSWORD: testAdminPassword,
  };

  const firstRunOutput = execFileSync('node', [seedScriptPath], { env: seedEnv }).toString();
  try {
    assert(firstRunOutput.includes('created successfully'), 'expected creation message');
    record('1. Admin seed works', true);
  } catch (err) {
    record('1. Admin seed works', false, err.message);
  }

  const secondRunOutput = execFileSync('node', [seedScriptPath], { env: seedEnv }).toString();
  try {
    assert(secondRunOutput.includes('No changes made'), 'expected "no changes" message');
    const countAfter = await User.countDocuments({ email: testAdminEmail });
    assert(countAfter === 1, `expected exactly 1 admin, found ${countAfter}`);
    record('2. Duplicate admin is not created', true);
  } catch (err) {
    record('2. Duplicate admin is not created', false, err.message);
  }

  // Temporary doctor-role user for the role-middleware check (item 10).
  const doctorPasswordHash = await hashPassword('Verify-Auth-Doctor-1!');
  const doctorUser = await User.create({
    name: 'Verify Auth Doctor',
    email: testDoctorEmail,
    passwordHash: doctorPasswordHash,
    role: 'DOCTOR',
  });

  // --- Start the real Express app on an ephemeral port for HTTP-level checks ---
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  let issuedToken = null;

  try {
    // --- 3 & 6: correct login succeeds and returns a JWT ---
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: testAdminPassword }),
    });
    const loginBody = await loginRes.json();
    try {
      assert(loginRes.status === 200, `expected 200, got ${loginRes.status}`);
      assert(typeof loginBody.token === 'string' && loginBody.token.length > 0, 'expected a token string');
      assert(loginBody.user && loginBody.user.passwordHash === undefined, 'response must not include passwordHash');
      issuedToken = loginBody.token;
      record('3. Correct login succeeds', true);
      record('6. JWT is generated', true);
    } catch (err) {
      record('3. Correct login succeeds', false, err.message);
      record('6. JWT is generated', false, err.message);
    }

    // --- 4: incorrect password fails ---
    const wrongPassRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: 'definitely-wrong-password' }),
    });
    try {
      assert(wrongPassRes.status === 401, `expected 401, got ${wrongPassRes.status}`);
      record('4. Incorrect password fails', true);
    } catch (err) {
      record('4. Incorrect password fails', false, err.message);
    }

    // --- 5: unknown email fails ---
    const unknownEmailRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'no-such-user@example.com', password: 'whatever123' }),
    });
    try {
      assert(unknownEmailRes.status === 401, `expected 401, got ${unknownEmailRes.status}`);
      record('5. Unknown email fails', true);
    } catch (err) {
      record('5. Unknown email fails', false, err.message);
    }

    // --- 7: /auth/me works with a valid token ---
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${issuedToken}` },
    });
    const meBody = await meRes.json();
    try {
      assert(meRes.status === 200, `expected 200, got ${meRes.status}`);
      assert(meBody.user && meBody.user.email === testAdminEmail, 'expected the logged-in user back');
      assert(meBody.user.passwordHash === undefined, 'response must not include passwordHash');
      record('7. /auth/me works with a valid token', true);
    } catch (err) {
      record('7. /auth/me works with a valid token', false, err.message);
    }

    // --- 8: /auth/me fails without a token ---
    const meNoTokenRes = await fetch(`${baseUrl}/auth/me`);
    try {
      assert(meNoTokenRes.status === 401, `expected 401, got ${meNoTokenRes.status}`);
      record('8. /auth/me fails without a token', true);
    } catch (err) {
      record('8. /auth/me fails without a token', false, err.message);
    }

    // --- 9: invalid token is rejected ---
    const meBadTokenRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: 'Bearer this.is.not.a.valid.jwt' },
    });
    try {
      assert(meBadTokenRes.status === 401, `expected 401, got ${meBadTokenRes.status}`);
      record('9. Invalid token is rejected', true);
    } catch (err) {
      record('9. Invalid token is rejected', false, err.message);
    }

    // --- 10: requireRole distinguishes ADMIN and DOCTOR ---
    try {
      const adminOnly = requireRole('ADMIN');
      const doctorOnly = requireRole('DOCTOR');

      const outcomes = [];
      adminOnly({ user: { role: 'ADMIN' } }, {}, (err) => outcomes.push(['admin-as-admin', err]));
      adminOnly({ user: { role: 'DOCTOR' } }, {}, (err) => outcomes.push(['doctor-as-admin', err]));
      doctorOnly({ user: { role: 'DOCTOR' } }, {}, (err) => outcomes.push(['doctor-as-doctor', err]));
      doctorOnly({ user: { role: 'ADMIN' } }, {}, (err) => outcomes.push(['admin-as-doctor', err]));

      const byKey = Object.fromEntries(outcomes);
      assert(byKey['admin-as-admin'] === undefined, 'ADMIN should pass requireRole("ADMIN")');
      assert(byKey['doctor-as-admin'] && byKey['doctor-as-admin'].status === 403, 'DOCTOR should be rejected by requireRole("ADMIN")');
      assert(byKey['doctor-as-doctor'] === undefined, 'DOCTOR should pass requireRole("DOCTOR")');
      assert(byKey['admin-as-doctor'] && byKey['admin-as-doctor'].status === 403, 'ADMIN should be rejected by requireRole("DOCTOR")');

      record('10. requireRole distinguishes ADMIN and DOCTOR', true);
    } catch (err) {
      record('10. requireRole distinguishes ADMIN and DOCTOR', false, err.message);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));

    // Clean up temporary test users.
    await User.deleteMany({ email: { $in: [testAdminEmail, testDoctorEmail] } });
    await mongoose.disconnect();
  }

  console.log('');
  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.log(`${failed.length} check(s) FAILED.`);
    process.exit(1);
  }

  console.log(`All ${results.length} checks PASSED.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification script crashed:', err.message);
  process.exit(1);
});
