// Regression check for the admin doctor-list status-filter validation.
//
// Unlike the appointment-list filters (see verifyAppointmentStatusFilter.js),
// `doctor.service.js`'s listDoctors() never assigned `status` directly into
// a Mongo query object - it only ever used strict equality
// (`status === 'ACTIVE'` / `status === 'INACTIVE'`) to decide whether to
// push a $match stage, so it was never exploitable as a NoSQL operator
// injection vector. It did, however, silently ignore any unsupported value
// instead of rejecting it, which is inconsistent with every other list
// filter in the app. listDoctors() now rejects anything that isn't exactly
// 'ACTIVE' or 'INACTIVE' with a 400, matching the appointment-list fix.
//
// This hits the real HTTP server end-to-end (consistent with the project's
// other e2e verify scripts) - no AI/external API calls involved.
//
// Run with: npm run verify:doctor-status-filter

const http = require('http');

const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
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

  const adminUser = await User.create({
    name: 'Verify DoctorStatusFilter Admin',
    email: `verify-doctor-status-admin-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-DoctorStatus-Admin-1!'),
    role: 'ADMIN',
  });

  const doctorUser = await User.create({
    name: 'Verify DoctorStatusFilter Doctor',
    email: `verify-doctor-status-doctor-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-DoctorStatus-1!'),
    role: 'DOCTOR',
  });
  const doctor = await Doctor.create({ userId: doctorUser._id, specialization: 'General Dentistry' });

  const adminToken = generateToken(adminUser);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  const asAdmin = { Authorization: `Bearer ${adminToken}` };

  try {
    // 1. Valid status filter (ACTIVE) still works and includes the active doctor.
    const validRes = await fetch(`${baseUrl}/doctors?status=ACTIVE`, { headers: asAdmin });
    const validBody = await validRes.json();
    try {
      assert(validRes.status === 200, `expected 200, got ${validRes.status}`);
      assert(
        validBody.doctors.some((d) => d.id === doctor._id.toString()),
        'expected the active doctor to be included'
      );
      record('Doctor list: valid status filter (ACTIVE) returns 200 with matching results', true);
    } catch (err) {
      record('Doctor list: valid status filter (ACTIVE) returns 200 with matching results', false, err.message);
    }

    // 2. Valid status filter (INACTIVE) still works and excludes the active doctor.
    const inactiveRes = await fetch(`${baseUrl}/doctors?status=INACTIVE`, { headers: asAdmin });
    const inactiveBody = await inactiveRes.json();
    try {
      assert(inactiveRes.status === 200, `expected 200, got ${inactiveRes.status}`);
      assert(
        !inactiveBody.doctors.some((d) => d.id === doctor._id.toString()),
        'expected the active doctor to be excluded from an INACTIVE filter'
      );
      record('Doctor list: valid status filter (INACTIVE) returns 200 and correctly filters', true);
    } catch (err) {
      record('Doctor list: valid status filter (INACTIVE) returns 200 and correctly filters', false, err.message);
    }

    // 3. Unsupported status value is rejected with 400, not silently ignored.
    const badRes = await fetch(`${baseUrl}/doctors?status=NOT_A_REAL_STATUS`, { headers: asAdmin });
    try {
      assert(badRes.status === 400, `expected 400, got ${badRes.status}`);
      record('Doctor list: unsupported status value is rejected with 400', true);
    } catch (err) {
      record('Doctor list: unsupported status value is rejected with 400', false, err.message);
    }

    // 4. Object-shaped status (?status[$ne]=null) is rejected, not silently
    // treated as "no filter" or compared unsafely.
    const injectionRes = await fetch(`${baseUrl}/doctors?status[$ne]=null`, { headers: asAdmin });
    try {
      assert(injectionRes.status === 400, `expected 400, got ${injectionRes.status}`);
      record('Doctor list: object-shaped status query param ($ne) is rejected with 400', true);
    } catch (err) {
      record('Doctor list: object-shaped status query param ($ne) is rejected with 400', false, err.message);
    }

    // 5. Array-shaped status (?status=ACTIVE&status=INACTIVE) is rejected.
    const arrayRes = await fetch(`${baseUrl}/doctors?status=ACTIVE&status=INACTIVE`, { headers: asAdmin });
    try {
      assert(arrayRes.status === 400, `expected 400, got ${arrayRes.status}`);
      record('Doctor list: array-shaped status query param is rejected with 400', true);
    } catch (err) {
      record('Doctor list: array-shaped status query param is rejected with 400', false, err.message);
    }

    // 6. Regression: no status filter at all (the common case) still works.
    const noFilterRes = await fetch(`${baseUrl}/doctors`, { headers: asAdmin });
    try {
      assert(noFilterRes.status === 200, `expected 200, got ${noFilterRes.status}`);
      record('Doctor list: no status filter (unfiltered list) still works', true);
    } catch (err) {
      record('Doctor list: no status filter (unfiltered list) still works', false, err.message);
    }

    // 7. Regression: the existing `search` filter is unaffected by this change.
    const searchRes = await fetch(`${baseUrl}/doctors?search=General`, { headers: asAdmin });
    try {
      assert(searchRes.status === 200, `expected 200, got ${searchRes.status}`);
      record('Doctor list: existing search filter still works unaffected', true);
    } catch (err) {
      record('Doctor list: existing search filter still works unaffected', false, err.message);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));

    await Doctor.deleteOne({ _id: doctor._id });
    await User.deleteMany({ _id: { $in: [adminUser._id, doctorUser._id] } });

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
