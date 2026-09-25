// End-to-end check of Phase 5 Doctor Management. Covers:
//   1. Admin can list doctors
//   2. Admin can create a doctor
//   3. Admin can view doctor details
//   4. Admin can update a doctor
//   5. Admin can deactivate a doctor
//   6. Admin can reactivate a doctor
//   7. Duplicate email is rejected
//   8. Invalid doctor ID is handled
//   9. Unauthenticated request is rejected
//  10. DOCTOR role cannot access Admin doctor-management endpoints
//  11. Password is never returned in API responses
//
// Uses its own temporary users (separate from your real admin/doctors) and
// cleans them up afterwards. Never prints real passwords.
//
// Run with: npm run verify:doctors

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

function containsPasswordField(body) {
  const text = JSON.stringify(body);
  return /passwordHash|"password"/i.test(text);
}

async function main() {
  await connectDB();

  const suffix = Date.now();
  const adminEmail = `verify-doctors-admin-${suffix}@example.com`;
  const doctorLoginEmail = `verify-doctors-role-${suffix}@example.com`;
  const newDoctorEmail = `verify-doctors-new-${suffix}@example.com`;

  const adminUser = await User.create({
    name: 'Verify Doctors Admin',
    email: adminEmail,
    passwordHash: await hashPassword('Verify-Admin-Pass-1!'),
    role: 'ADMIN',
  });
  const adminToken = generateToken(adminUser);

  const doctorRoleUser = await User.create({
    name: 'Verify Doctors Role Account',
    email: doctorLoginEmail,
    passwordHash: await hashPassword('Verify-Doctor-Pass-1!'),
    role: 'DOCTOR',
  });
  const doctorRoleDoctorProfile = await Doctor.create({
    userId: doctorRoleUser._id,
    specialization: 'General Dentistry',
  });
  const doctorToken = generateToken(doctorRoleUser);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  let createdDoctorId = null;

  try {
    // --- 9: unauthenticated request rejected ---
    const noAuthRes = await fetch(`${baseUrl}/doctors`);
    try {
      assert(noAuthRes.status === 401, `expected 401, got ${noAuthRes.status}`);
      record('9. Unauthenticated request is rejected', true);
    } catch (err) {
      record('9. Unauthenticated request is rejected', false, err.message);
    }

    // --- 10: DOCTOR role cannot access ---
    const doctorAccessRes = await fetch(`${baseUrl}/doctors`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    try {
      assert(doctorAccessRes.status === 403, `expected 403, got ${doctorAccessRes.status}`);
      record('10. DOCTOR role cannot access admin doctor-management endpoints', true);
    } catch (err) {
      record('10. DOCTOR role cannot access admin doctor-management endpoints', false, err.message);
    }

    const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    // --- 2: admin can create a doctor ---
    const createRes = await fetch(`${baseUrl}/doctors`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Verify New Doctor',
        email: newDoctorEmail,
        password: 'Verify-New-Doctor-1!',
        specialization: 'Orthodontics',
        qualifications: ['BDS', 'MDS'],
        experienceYears: 5,
      }),
    });
    const createBody = await createRes.json();
    try {
      assert(createRes.status === 201, `expected 201, got ${createRes.status}`);
      assert(createBody.doctor?.id, 'expected a created doctor id');
      assert(!containsPasswordField(createBody), 'response must not include password/passwordHash');
      createdDoctorId = createBody.doctor.id;
      record('2. Admin can create a doctor', true);
      record('11. Password is never returned (create)', true);
    } catch (err) {
      record('2. Admin can create a doctor', false, err.message);
      record('11. Password is never returned (create)', false, err.message);
    }

    // --- 7: duplicate email is rejected ---
    const dupRes = await fetch(`${baseUrl}/doctors`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Duplicate Attempt',
        email: newDoctorEmail,
        password: 'Verify-New-Doctor-1!',
        specialization: 'Orthodontics',
      }),
    });
    try {
      assert(dupRes.status === 409, `expected 409, got ${dupRes.status}`);
      record('7. Duplicate email is rejected', true);
    } catch (err) {
      record('7. Duplicate email is rejected', false, err.message);
    }

    // --- 1: admin can list doctors ---
    const listRes = await fetch(`${baseUrl}/doctors?limit=50`, { headers: adminHeaders });
    const listBody = await listRes.json();
    try {
      assert(listRes.status === 200, `expected 200, got ${listRes.status}`);
      assert(Array.isArray(listBody.doctors), 'expected a doctors array');
      assert(listBody.doctors.some((d) => d.id === createdDoctorId), 'expected the new doctor in the list');
      assert(typeof listBody.stats?.total === 'number', 'expected stats.total');
      assert(!containsPasswordField(listBody), 'response must not include password/passwordHash');
      record('1. Admin can list doctors', true);
    } catch (err) {
      record('1. Admin can list doctors', false, err.message);
    }

    // --- 3: admin can view doctor details ---
    const detailRes = await fetch(`${baseUrl}/doctors/${createdDoctorId}`, { headers: adminHeaders });
    const detailBody = await detailRes.json();
    try {
      assert(detailRes.status === 200, `expected 200, got ${detailRes.status}`);
      assert(detailBody.doctor?.email === newDoctorEmail.toLowerCase(), 'expected matching email');
      assert(!containsPasswordField(detailBody), 'response must not include password/passwordHash');
      record('3. Admin can view doctor details', true);
    } catch (err) {
      record('3. Admin can view doctor details', false, err.message);
    }

    // --- 8: invalid doctor ID is handled ---
    const invalidIdRes = await fetch(`${baseUrl}/doctors/not-a-valid-id`, { headers: adminHeaders });
    try {
      assert(invalidIdRes.status === 400, `expected 400, got ${invalidIdRes.status}`);
      record('8. Invalid doctor ID is handled', true);
    } catch (err) {
      record('8. Invalid doctor ID is handled', false, err.message);
    }

    // --- 4: admin can update a doctor ---
    const updateRes = await fetch(`${baseUrl}/doctors/${createdDoctorId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ specialization: 'Pediatric Dentistry', experienceYears: 6 }),
    });
    const updateBody = await updateRes.json();
    try {
      assert(updateRes.status === 200, `expected 200, got ${updateRes.status}`);
      assert(updateBody.doctor?.specialization === 'Pediatric Dentistry', 'expected updated specialization');
      assert(!containsPasswordField(updateBody), 'response must not include password/passwordHash');
      record('4. Admin can update a doctor', true);
    } catch (err) {
      record('4. Admin can update a doctor', false, err.message);
    }

    // --- 5: admin can deactivate a doctor, and login is actually blocked ---
    const deactivateRes = await fetch(`${baseUrl}/doctors/${createdDoctorId}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ isActive: false }),
    });
    const deactivateBody = await deactivateRes.json();
    try {
      assert(deactivateRes.status === 200, `expected 200, got ${deactivateRes.status}`);
      assert(deactivateBody.doctor?.isActive === false, 'expected isActive false');

      const loginAfterDeactivateRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newDoctorEmail, password: 'Verify-New-Doctor-1!' }),
      });
      assert(
        loginAfterDeactivateRes.status === 401,
        `expected login to fail with 401 after deactivation, got ${loginAfterDeactivateRes.status}`
      );

      record('5. Admin can deactivate a doctor (and login is blocked)', true);
    } catch (err) {
      record('5. Admin can deactivate a doctor (and login is blocked)', false, err.message);
    }

    // --- 6: admin can reactivate a doctor, and login works again ---
    const reactivateRes = await fetch(`${baseUrl}/doctors/${createdDoctorId}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ isActive: true }),
    });
    const reactivateBody = await reactivateRes.json();
    try {
      assert(reactivateRes.status === 200, `expected 200, got ${reactivateRes.status}`);
      assert(reactivateBody.doctor?.isActive === true, 'expected isActive true');

      const loginAfterReactivateRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newDoctorEmail, password: 'Verify-New-Doctor-1!' }),
      });
      assert(
        loginAfterReactivateRes.status === 200,
        `expected login to succeed after reactivation, got ${loginAfterReactivateRes.status}`
      );

      record('6. Admin can reactivate a doctor (and login works again)', true);
    } catch (err) {
      record('6. Admin can reactivate a doctor (and login works again)', false, err.message);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));

    await Doctor.deleteMany({ _id: { $in: [doctorRoleDoctorProfile._id, createdDoctorId].filter(Boolean) } });
    const newDoctorUser = await User.findOne({ email: newDoctorEmail });
    await User.deleteMany({
      _id: { $in: [adminUser._id, doctorRoleUser._id, newDoctorUser?._id].filter(Boolean) },
    });

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
