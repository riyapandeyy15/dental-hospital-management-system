// End-to-end check of the Phase 7 Patient Portal. Creates its own temporary
// doctor/patients, exercises registration, login, doctor discovery,
// availability, booking (including double-booking prevention), my
// appointments, cancellation, profile, and admin patient/appointment
// management - all over real HTTP - then cleans everything up.
//
// Run with: npm run verify:patient-portal

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
function containsSecrets(body) {
  return /passwordHash|"password"/i.test(JSON.stringify(body));
}

// Returns the next date (YYYY-MM-DD) that falls on the given ISO weekday
// (1=Mon..5=Fri) and is strictly in the future, so tests never depend on
// "today" having remaining slots. Built from local date components, NOT
// toISOString() - that converts to UTC and would silently roll the date
// back a day in any timezone ahead of UTC (e.g. IST).
function nextWeekdayDateStr(targetDayOfWeek) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== targetDayOfWeek) {
    d.setDate(d.getDate() + 1);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  await connectDB();
  const suffix = Date.now();

  const doctorUser = await User.create({
    name: 'Verify Patient Portal Doctor',
    email: `verify-pp-doctor-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-PP-Doctor-1!'),
    role: 'DOCTOR',
  });
  const doctor = await Doctor.create({
    userId: doctorUser._id,
    specialization: 'Orthodontics',
    isActive: true,
    availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '11:00', slotDurationMinutes: 30 }],
  });

  const adminUser = await User.create({
    name: 'Verify PP Admin',
    email: `verify-pp-admin-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-PP-Admin-1!'),
    role: 'ADMIN',
  });
  const adminToken = generateToken(adminUser);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  const jsonHeaders = { 'Content-Type': 'application/json' };
  const asAdmin = { Authorization: `Bearer ${adminToken}`, ...jsonHeaders };

  const registerEmail = `verify-pp-patient-${suffix}@example.com`;
  const registerPassword = 'Verify-PP-Patient-1!';
  let patientAToken = null;
  let patientAId = null;
  let bookedAppointmentId = null;
  let secondPatientUser = null;
  let secondPatientToken = null;
  let adminCreatedPatientId = null;

  const mondayDateStr = nextWeekdayDateStr(1);

  try {
    // 1. Registration
    const registerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: 'Verify Patient A', email: registerEmail, phone: `9${suffix}`.slice(0, 10), password: registerPassword }),
    });
    const registerBody = await registerRes.json();
    try {
      assert(registerRes.status === 201, `expected 201, got ${registerRes.status}`);
      assert(registerBody.user.role === 'PATIENT', 'expected role PATIENT');
      assert(!containsSecrets(registerBody), 'must not include password/passwordHash');
      patientAToken = registerBody.token;
      record('Patient registration succeeds', true);
    } catch (err) {
      record('Patient registration succeeds', false, err.message);
    }

    // 2. Duplicate registration rejected
    const dupRegisterRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: 'Dup', email: registerEmail, phone: '9000000000', password: registerPassword }),
    });
    try {
      assert(dupRegisterRes.status === 409, `expected 409, got ${dupRegisterRes.status}`);
      record('Duplicate registration is rejected', true);
    } catch (err) {
      record('Duplicate registration is rejected', false, err.message);
    }

    // 3. Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: registerEmail, password: registerPassword }),
    });
    const loginBody = await loginRes.json();
    try {
      assert(loginRes.status === 200 && loginBody.user.role === 'PATIENT', 'expected successful patient login');
      patientAToken = loginBody.token;
      record('Patient login succeeds', true);
    } catch (err) {
      record('Patient login succeeds', false, err.message);
    }

    const asPatientA = { Authorization: `Bearer ${patientAToken}`, ...jsonHeaders };

    // 4. Public doctor discovery
    const publicListRes = await fetch(`${baseUrl}/doctors/public`);
    const publicListBody = await publicListRes.json();
    try {
      assert(publicListRes.status === 200, `expected 200, got ${publicListRes.status}`);
      assert(publicListBody.doctors.some((d) => d.id === doctor._id.toString()), 'expected our doctor in public list');
      assert(!containsSecrets(publicListBody), 'public doctor list must not include secrets');
      assert(!JSON.stringify(publicListBody).includes(doctorUser.email), 'public doctor list must not include email');
      record('Public doctor discovery works and hides contact info', true);
    } catch (err) {
      record('Public doctor discovery works and hides contact info', false, err.message);
    }

    // 5. Availability calculation
    const availRes = await fetch(`${baseUrl}/doctors/public/${doctor._id}/availability?date=${mondayDateStr}`);
    const availBody = await availRes.json();
    try {
      assert(availRes.status === 200, `expected 200, got ${availRes.status}`);
      assert(availBody.slots.length === 4, `expected 4 slots (09:00,09:30,10:00,10:30), got ${availBody.slots.length}`);
      assert(availBody.slots.every((s) => s.status === 'available'), 'expected all slots available before booking');
      record('Availability is calculated from real doctor schedule', true);
    } catch (err) {
      record('Availability is calculated from real doctor schedule', false, err.message);
    }

    // 6. Book appointment
    const bookRes = await fetch(`${baseUrl}/patient/appointments`, {
      method: 'POST',
      headers: asPatientA,
      body: JSON.stringify({ doctorId: doctor._id.toString(), appointmentDate: mondayDateStr, startTime: '09:00', reason: 'Checkup' }),
    });
    const bookBody = await bookRes.json();
    try {
      assert(bookRes.status === 201, `expected 201, got ${bookRes.status}: ${JSON.stringify(bookBody)}`);
      bookedAppointmentId = bookBody.appointment.id;
      record('Patient can book an available slot', true);
    } catch (err) {
      record('Patient can book an available slot', false, err.message);
    }

    // 7. Slot now shows booked
    const availAfterRes = await fetch(`${baseUrl}/doctors/public/${doctor._id}/availability?date=${mondayDateStr}`);
    const availAfterBody = await availAfterRes.json();
    try {
      const nineAm = availAfterBody.slots.find((s) => s.startTime === '09:00');
      assert(nineAm && nineAm.status === 'booked', 'expected 09:00 slot to now show booked');
      record('Booked slot no longer shows as available', true);
    } catch (err) {
      record('Booked slot no longer shows as available', false, err.message);
    }

    // 8. Double-booking prevention (second patient tries the same slot)
    const secondEmail = `verify-pp-patient2-${suffix}@example.com`;
    secondPatientUser = await User.create({
      name: 'Verify Patient B',
      email: secondEmail,
      passwordHash: await hashPassword('Verify-PP-Patient2-1!'),
      role: 'PATIENT',
    });
    await Patient.create({ userId: secondPatientUser._id, name: 'Verify Patient B', phone: `8${suffix}`.slice(0, 10) });
    secondPatientToken = generateToken(secondPatientUser);
    const asPatientB = { Authorization: `Bearer ${secondPatientToken}`, ...jsonHeaders };

    const doubleBookRes = await fetch(`${baseUrl}/patient/appointments`, {
      method: 'POST',
      headers: asPatientB,
      body: JSON.stringify({ doctorId: doctor._id.toString(), appointmentDate: mondayDateStr, startTime: '09:00', reason: 'Also checkup' }),
    });
    try {
      assert(doubleBookRes.status === 409 || doubleBookRes.status === 400, `expected 409/400, got ${doubleBookRes.status}`);
      record('Double-booking the same doctor/date/time is rejected', true);
    } catch (err) {
      record('Double-booking the same doctor/date/time is rejected', false, err.message);
    }

    // 9. My appointments (patient A)
    const myApptsRes = await fetch(`${baseUrl}/patient/appointments`, { headers: asPatientA });
    const myApptsBody = await myApptsRes.json();
    try {
      assert(myApptsRes.status === 200 && myApptsBody.appointments.length === 1, 'expected exactly 1 appointment for patient A');
      record('Patient sees their own appointment', true);
    } catch (err) {
      record('Patient sees their own appointment', false, err.message);
    }

    // 10. Patient B cannot see/cancel patient A's appointment
    const otherGetRes = await fetch(`${baseUrl}/patient/appointments/${bookedAppointmentId}`, { headers: asPatientB });
    try {
      assert(otherGetRes.status === 404, `expected 404, got ${otherGetRes.status}`);
      record('Patient cannot access another patient’s appointment', true);
    } catch (err) {
      record('Patient cannot access another patient’s appointment', false, err.message);
    }

    // 11. Patient A cancels their own appointment
    const cancelRes = await fetch(`${baseUrl}/patient/appointments/${bookedAppointmentId}/cancel`, {
      method: 'PATCH',
      headers: asPatientA,
    });
    const cancelBody = await cancelRes.json();
    try {
      assert(cancelRes.status === 200 && cancelBody.appointment.status === 'CANCELLED', 'expected cancellation to succeed');
      record('Patient can cancel their own pending appointment', true);
    } catch (err) {
      record('Patient can cancel their own pending appointment', false, err.message);
    }

    // 12. Cancelled slot is bookable again (partial unique index works correctly)
    const rebookRes = await fetch(`${baseUrl}/patient/appointments`, {
      method: 'POST',
      headers: asPatientB,
      body: JSON.stringify({ doctorId: doctor._id.toString(), appointmentDate: mondayDateStr, startTime: '09:00', reason: 'Now free' }),
    });
    try {
      assert(rebookRes.status === 201, `expected 201, got ${rebookRes.status}`);
      record('A cancelled slot becomes bookable again', true);
    } catch (err) {
      record('A cancelled slot becomes bookable again', false, err.message);
    }

    // 13. Patient profile get/update
    const profileRes = await fetch(`${baseUrl}/patient/profile`, { headers: asPatientA });
    const profileBody = await profileRes.json();
    try {
      assert(profileRes.status === 200 && profileBody.patient.email === registerEmail.toLowerCase(), 'expected matching profile');
      record('Patient can view own profile', true);
    } catch (err) {
      record('Patient can view own profile', false, err.message);
    }

    const updateProfileRes = await fetch(`${baseUrl}/patient/profile`, {
      method: 'PUT',
      headers: asPatientA,
      body: JSON.stringify({ address: '123 Test Lane' }),
    });
    const updateProfileBody = await updateProfileRes.json();
    try {
      assert(updateProfileRes.status === 200 && updateProfileBody.patient.address === '123 Test Lane', 'expected updated address');
      record('Patient can update own profile', true);
    } catch (err) {
      record('Patient can update own profile', false, err.message);
    }

    // 14. Patient dashboard
    const dashRes = await fetch(`${baseUrl}/patient/dashboard`, { headers: asPatientA });
    const dashBody = await dashRes.json();
    try {
      assert(dashRes.status === 200 && typeof dashBody.stats.upcomingAppointments === 'number', 'expected dashboard stats');
      record('Patient dashboard returns real stats', true);
    } catch (err) {
      record('Patient dashboard returns real stats', false, err.message);
    }

    // 15. Patient blocked from admin/doctor routes
    const patientOnAdminRes = await fetch(`${baseUrl}/doctors`, { headers: asPatientA });
    try {
      assert(patientOnAdminRes.status === 403, `expected 403, got ${patientOnAdminRes.status}`);
      record('Patient is blocked from Admin Doctor Management', true);
    } catch (err) {
      record('Patient is blocked from Admin Doctor Management', false, err.message);
    }
    const patientOnDoctorRes = await fetch(`${baseUrl}/doctor/dashboard`, { headers: asPatientA });
    try {
      assert(patientOnDoctorRes.status === 403, `expected 403, got ${patientOnDoctorRes.status}`);
      record('Patient is blocked from Doctor Portal routes', true);
    } catch (err) {
      record('Patient is blocked from Doctor Portal routes', false, err.message);
    }

    // 16. Admin patient management
    const adminCreatePatientRes = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: asAdmin,
      body: JSON.stringify({ name: 'Verify Admin-Created Patient', phone: `7${suffix}`.slice(0, 10) }),
    });
    const adminCreatePatientBody = await adminCreatePatientRes.json();
    try {
      assert(adminCreatePatientRes.status === 201, `expected 201, got ${adminCreatePatientRes.status}`);
      adminCreatedPatientId = adminCreatePatientBody.patient.id;
      record('Admin can create a walk-in patient', true);
    } catch (err) {
      record('Admin can create a walk-in patient', false, err.message);
    }

    const adminListPatientsRes = await fetch(`${baseUrl}/patients?limit=100`, { headers: asAdmin });
    const adminListPatientsBody = await adminListPatientsRes.json();
    try {
      assert(
        adminListPatientsRes.status === 200 &&
          adminListPatientsBody.patients.some((p) => p.id === adminCreatedPatientId),
        'expected admin-created patient in list'
      );
      record('Admin can list patients', true);
    } catch (err) {
      record('Admin can list patients', false, err.message);
    }

    // 17. Admin appointment management
    const adminCreateApptRes = await fetch(`${baseUrl}/appointments`, {
      method: 'POST',
      headers: asAdmin,
      body: JSON.stringify({
        patientId: adminCreatedPatientId,
        doctorId: doctor._id.toString(),
        appointmentDate: mondayDateStr,
        startTime: '10:00',
        reason: 'Admin-booked',
      }),
    });
    const adminCreateApptBody = await adminCreateApptRes.json();
    try {
      assert(adminCreateApptRes.status === 201, `expected 201, got ${adminCreateApptRes.status}: ${JSON.stringify(adminCreateApptBody)}`);
      record('Admin can book an appointment on a patient’s behalf', true);
    } catch (err) {
      record('Admin can book an appointment on a patient’s behalf', false, err.message);
    }

    const adminListApptRes = await fetch(`${baseUrl}/appointments?doctorId=${doctor._id}`, { headers: asAdmin });
    const adminListApptBody = await adminListApptRes.json();
    try {
      assert(adminListApptRes.status === 200 && adminListApptBody.appointments.length >= 2, 'expected 2+ appointments for this doctor');
      record('Admin can list/filter appointments by doctor', true);
    } catch (err) {
      record('Admin can list/filter appointments by doctor', false, err.message);
    }

    const adminStatusRes = await fetch(`${baseUrl}/appointments/${adminCreateApptBody.appointment.id}/status`, {
      method: 'PATCH',
      headers: asAdmin,
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    try {
      assert(adminStatusRes.status === 200, `expected 200, got ${adminStatusRes.status}`);
      record('Admin can update appointment status', true);
    } catch (err) {
      record('Admin can update appointment status', false, err.message);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));

    await Appointment.deleteMany({ doctorId: doctor._id });
    await Doctor.deleteOne({ _id: doctor._id });
    const patientAUser = await User.findOne({ email: registerEmail });
    await Patient.deleteMany({
      $or: [
        { userId: { $in: [patientAUser?._id, secondPatientUser?._id].filter(Boolean) } },
        { _id: adminCreatedPatientId },
      ],
    });
    await User.deleteMany({
      _id: { $in: [doctorUser._id, adminUser._id, patientAUser?._id, secondPatientUser?._id].filter(Boolean) },
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
