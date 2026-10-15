// Regression check for the appointment-list status-filter fix.
//
// Root cause fixed: `adminAppointment.service.js` (listAllAppointments) and
// `appointment.service.js` (listAppointmentsForDoctor) both built a Mongo
// query with `if (status) query.status = status;`, taking `status` straight
// from the query string with no validation. Express's query parser turns
// `?status[$ne]=null` into an object, so `query.status` could become a live
// Mongo operator object instead of a plain string - a NoSQL
// operator-injection vector. Both list functions now reject anything that
// isn't literally one of the known appointment-status strings before it
// reaches the query object.
//
// This hits the real HTTP server end-to-end (consistent with the project's
// other e2e verify scripts) - no AI/external API calls involved.
//
// Run with: npm run verify:appointment-status-filter

const http = require('http');

const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const { hashPassword, generateToken } = require('../src/modules/auth/auth.service');

const results = [];
function record(name, passed, detail) {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}${detail ? ` (${detail})` : ''}`);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function todayAt(h, m) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  await connectDB();
  const suffix = Date.now();

  const doctorUser = await User.create({
    name: 'Verify StatusFilter Doctor',
    email: `verify-status-doctor-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-StatusFilter-1!'),
    role: 'DOCTOR',
  });
  const doctor = await Doctor.create({ userId: doctorUser._id, specialization: 'General Dentistry' });

  const adminUser = await User.create({
    name: 'Verify StatusFilter Admin',
    email: `verify-status-admin-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-StatusFilter-Admin-1!'),
    role: 'ADMIN',
  });

  const patient = await Patient.create({ name: 'Verify StatusFilter Patient', phone: `9${suffix}`.slice(0, 10) });

  const appointment = await Appointment.create({
    doctorId: doctor._id,
    patientId: patient._id,
    appointmentDate: todayAt(0, 0),
    startTime: '10:00',
    endTime: '10:30',
    status: 'PENDING',
    reason: 'Verification visit',
  });

  const doctorToken = generateToken(doctorUser);
  const adminToken = generateToken(adminUser);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  const asDoctor = { Authorization: `Bearer ${doctorToken}` };
  const asAdmin = { Authorization: `Bearer ${adminToken}` };

  try {
    // --- Admin list (/api/v1/appointments) ---

    // 1. Valid status filter still works and returns the matching appointment.
    const adminValidRes = await fetch(`${baseUrl}/appointments?status=PENDING`, { headers: asAdmin });
    const adminValidBody = await adminValidRes.json();
    try {
      assert(adminValidRes.status === 200, `expected 200, got ${adminValidRes.status}`);
      assert(
        adminValidBody.appointments.some((a) => a.id === appointment._id.toString()),
        'expected the PENDING appointment to be included'
      );
      record('Admin list: valid status filter (PENDING) returns 200 with matching results', true);
    } catch (err) {
      record('Admin list: valid status filter (PENDING) returns 200 with matching results', false, err.message);
    }

    // 2. Unsupported status value is rejected with 400, not silently ignored.
    const adminBadRes = await fetch(`${baseUrl}/appointments?status=NOT_A_REAL_STATUS`, { headers: asAdmin });
    try {
      assert(adminBadRes.status === 400, `expected 400, got ${adminBadRes.status}`);
      record('Admin list: unsupported status value is rejected with 400', true);
    } catch (err) {
      record('Admin list: unsupported status value is rejected with 400', false, err.message);
    }

    // 3. Object/operator-shaped status (?status[$ne]=null) is rejected, not
    // passed through as a live Mongo operator.
    const adminInjectionRes = await fetch(`${baseUrl}/appointments?status[$ne]=null`, { headers: asAdmin });
    try {
      assert(adminInjectionRes.status === 400, `expected 400, got ${adminInjectionRes.status}`);
      record('Admin list: object-shaped status query param ($ne) is rejected with 400', true);
    } catch (err) {
      record('Admin list: object-shaped status query param ($ne) is rejected with 400', false, err.message);
    }

    // 4. Array-shaped status (?status=PENDING&status=CONFIRMED) is also rejected.
    const adminArrayRes = await fetch(`${baseUrl}/appointments?status=PENDING&status=CONFIRMED`, { headers: asAdmin });
    try {
      assert(adminArrayRes.status === 400, `expected 400, got ${adminArrayRes.status}`);
      record('Admin list: array-shaped status query param is rejected with 400', true);
    } catch (err) {
      record('Admin list: array-shaped status query param is rejected with 400', false, err.message);
    }

    // 5. Regression: other existing filters (doctorId) are unaffected by this change.
    const adminDoctorFilterRes = await fetch(`${baseUrl}/appointments?doctorId=${doctor._id}`, { headers: asAdmin });
    try {
      assert(adminDoctorFilterRes.status === 200, `expected 200, got ${adminDoctorFilterRes.status}`);
      record('Admin list: existing doctorId filter still works unaffected', true);
    } catch (err) {
      record('Admin list: existing doctorId filter still works unaffected', false, err.message);
    }

    // --- Doctor list (/api/v1/doctor/appointments) ---

    // 6. Valid status filter still works.
    const doctorValidRes = await fetch(`${baseUrl}/doctor/appointments?status=PENDING`, { headers: asDoctor });
    const doctorValidBody = await doctorValidRes.json();
    try {
      assert(doctorValidRes.status === 200, `expected 200, got ${doctorValidRes.status}`);
      assert(
        doctorValidBody.appointments.some((a) => a.id === appointment._id.toString()),
        'expected the PENDING appointment to be included'
      );
      record('Doctor list: valid status filter (PENDING) returns 200 with matching results', true);
    } catch (err) {
      record('Doctor list: valid status filter (PENDING) returns 200 with matching results', false, err.message);
    }

    // 7. Unsupported status value is rejected with 400.
    const doctorBadRes = await fetch(`${baseUrl}/doctor/appointments?status=NOT_A_REAL_STATUS`, { headers: asDoctor });
    try {
      assert(doctorBadRes.status === 400, `expected 400, got ${doctorBadRes.status}`);
      record('Doctor list: unsupported status value is rejected with 400', true);
    } catch (err) {
      record('Doctor list: unsupported status value is rejected with 400', false, err.message);
    }

    // 8. Object/operator-shaped status is rejected.
    const doctorInjectionRes = await fetch(`${baseUrl}/doctor/appointments?status[$ne]=null`, { headers: asDoctor });
    try {
      assert(doctorInjectionRes.status === 400, `expected 400, got ${doctorInjectionRes.status}`);
      record('Doctor list: object-shaped status query param ($ne) is rejected with 400', true);
    } catch (err) {
      record('Doctor list: object-shaped status query param ($ne) is rejected with 400', false, err.message);
    }

    // 9. Regression: no filters at all still works (the common case).
    const doctorNoFilterRes = await fetch(`${baseUrl}/doctor/appointments`, { headers: asDoctor });
    try {
      assert(doctorNoFilterRes.status === 200, `expected 200, got ${doctorNoFilterRes.status}`);
      record('Doctor list: no status filter (unfiltered list) still works', true);
    } catch (err) {
      record('Doctor list: no status filter (unfiltered list) still works', false, err.message);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));

    await Appointment.deleteOne({ _id: appointment._id });
    await Patient.deleteOne({ _id: patient._id });
    await Doctor.deleteOne({ _id: doctor._id });
    await User.deleteMany({ _id: { $in: [doctorUser._id, adminUser._id] } });

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
