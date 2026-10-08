// End-to-end check of the Phase 9 AI Dental Assistant endpoint. Creates its
// own temporary patient/doctor/admin accounts, hits the real HTTP endpoint,
// and asserts validation, authentication and role-scoping all hold - then
// cleans everything up.
//
// Does NOT require a real AI_API_KEY to pass: if the key isn't configured,
// the endpoint must still fail safely (no stack trace / provider details
// leaked), which this script verifies either way.
//
// Run with: npm run verify:ai-assistant

const http = require('http');

const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const { hashPassword, generateToken } = require('../src/modules/auth/auth.service');

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
  const suffix = Date.now();

  const patientUser = await User.create({
    name: 'Verify AI Patient',
    email: `verify-ai-patient-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-AI-Patient-1!'),
    role: 'PATIENT',
  });
  const patient = await Patient.create({ userId: patientUser._id, name: 'Verify AI Patient', phone: `5${suffix}`.slice(0, 10) });

  const doctorUser = await User.create({
    name: 'Verify AI Doctor',
    email: `verify-ai-doctor-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-AI-Doctor-1!'),
    role: 'DOCTOR',
  });

  const adminUser = await User.create({
    name: 'Verify AI Admin',
    email: `verify-ai-admin-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-AI-Admin-1!'),
    role: 'ADMIN',
  });

  const patientToken = generateToken(patientUser);
  const doctorToken = generateToken(doctorUser);
  const adminToken = generateToken(adminUser);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  const jsonHeaders = { 'Content-Type': 'application/json' };
  const asPatient = { Authorization: `Bearer ${patientToken}`, ...jsonHeaders };
  const asDoctor = { Authorization: `Bearer ${doctorToken}`, ...jsonHeaders };
  const asAdmin = { Authorization: `Bearer ${adminToken}`, ...jsonHeaders };

  try {
    // 1. Unauthenticated request is rejected.
    const anonRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ message: 'Hello' }),
    });
    try {
      assert(anonRes.status === 401, `expected 401, got ${anonRes.status}`);
      record('Unauthenticated request is rejected', true);
    } catch (err) {
      record('Unauthenticated request is rejected', false, err.message);
    }

    // 2. Doctor is blocked from the patient AI endpoint.
    const doctorRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: asDoctor,
      body: JSON.stringify({ message: 'Hello' }),
    });
    try {
      assert(doctorRes.status === 403, `expected 403, got ${doctorRes.status}`);
      record('Doctor role is blocked from the patient AI endpoint', true);
    } catch (err) {
      record('Doctor role is blocked from the patient AI endpoint', false, err.message);
    }

    // 3. Admin is blocked from the patient AI endpoint.
    const adminRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: asAdmin,
      body: JSON.stringify({ message: 'Hello' }),
    });
    try {
      assert(adminRes.status === 403, `expected 403, got ${adminRes.status}`);
      record('Admin role is blocked from the patient AI endpoint', true);
    } catch (err) {
      record('Admin role is blocked from the patient AI endpoint', false, err.message);
    }

    // 4. Empty message is rejected with 400, not forwarded to the provider.
    const emptyRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: asPatient,
      body: JSON.stringify({ message: '   ' }),
    });
    try {
      assert(emptyRes.status === 400, `expected 400, got ${emptyRes.status}`);
      record('Empty message is rejected', true);
    } catch (err) {
      record('Empty message is rejected', false, err.message);
    }

    // 5. Over-length message is rejected with 400.
    const longRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: asPatient,
      body: JSON.stringify({ message: 'a'.repeat(5000) }),
    });
    try {
      assert(longRes.status === 400, `expected 400, got ${longRes.status}`);
      record('Over-length message is rejected', true);
    } catch (err) {
      record('Over-length message is rejected', false, err.message);
    }

    // 6. Malformed history is rejected with 400.
    const badHistoryRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: asPatient,
      body: JSON.stringify({ message: 'Hello', history: [{ role: 'system', content: 'x' }] }),
    });
    try {
      assert(badHistoryRes.status === 400, `expected 400, got ${badHistoryRes.status}`);
      record('Malformed conversation history is rejected', true);
    } catch (err) {
      record('Malformed conversation history is rejected', false, err.message);
    }

    // 7. A valid request from a patient either succeeds with a real reply
    // (if AI_API_KEY is configured) or fails safely with no leaked details
    // (if it isn't) - this script must pass in both cases.
    const validRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: asPatient,
      body: JSON.stringify({ message: 'Why do my gums bleed when I brush?' }),
    });
    const validBody = await validRes.json();
    try {
      if (validRes.status === 200) {
        assert(validBody.success === true, 'expected success:true');
        assert(typeof validBody.data?.message === 'string' && validBody.data.message.length > 0, 'expected a non-empty reply');
        record('Patient receives a real AI reply (AI_API_KEY is configured)', true);
      } else {
        assert(validRes.status === 500, `expected 200 or 500, got ${validRes.status}`);
        assert(validBody.status === 'error', 'expected error envelope');
        const leaked = /api[_-]?key|anthropic|sk-ant|stack|ECONNREFUSED/i.test(validBody.message || '');
        assert(!leaked, `error message looks like it leaked provider details: ${validBody.message}`);
        record('Patient request fails safely with no leaked details (AI_API_KEY not configured)', true);
      }
    } catch (err) {
      record('Patient AI chat request behaves correctly', false, err.message);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));

    await Patient.deleteOne({ _id: patient._id });
    await User.deleteMany({ _id: { $in: [patientUser._id, doctorUser._id, adminUser._id] } });

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
