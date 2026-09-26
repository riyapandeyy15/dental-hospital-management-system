// End-to-end check of the Phase 6 Doctor Module backend. Creates its own
// temporary doctor/patient/appointment data, exercises every doctor-portal
// endpoint over real HTTP, and cleans everything up afterwards.
//
// Run with: npm run verify:doctor-portal

const http = require('http');

const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const DentalRecord = require('../src/models/DentalRecord');
const Treatment = require('../src/models/Treatment');
const Prescription = require('../src/models/Prescription');
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
function todayAt(h, m) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  await connectDB();
  const suffix = Date.now();

  // --- Fixtures: two doctors (A = under test, B = to prove isolation), one
  // patient, an admin, and an unrelated patient B has never seen. ---
  const doctorAUser = await User.create({
    name: 'Verify Portal Doctor A',
    email: `verify-portal-doctorA-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-Portal-A-1!'),
    role: 'DOCTOR',
  });
  const doctorA = await Doctor.create({ userId: doctorAUser._id, specialization: 'Orthodontics', phone: '9000000001' });

  const doctorBUser = await User.create({
    name: 'Verify Portal Doctor B',
    email: `verify-portal-doctorB-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-Portal-B-1!'),
    role: 'DOCTOR',
  });
  const doctorB = await Doctor.create({ userId: doctorBUser._id, specialization: 'General Dentistry' });

  const adminUser = await User.create({
    name: 'Verify Portal Admin',
    email: `verify-portal-admin-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-Portal-Admin-1!'),
    role: 'ADMIN',
  });

  const patient = await Patient.create({ name: 'Verify Portal Patient', phone: `9${suffix}`.slice(0, 10) });

  const appointment = await Appointment.create({
    doctorId: doctorA._id,
    patientId: patient._id,
    appointmentDate: todayAt(0, 0),
    startTime: '10:00',
    endTime: '10:30',
    status: 'PENDING',
    reason: 'Verification visit',
  });

  const tokenA = generateToken(doctorAUser);
  const tokenB = generateToken(doctorBUser);
  const tokenAdmin = generateToken(adminUser);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  const asA = { Authorization: `Bearer ${tokenA}` };
  const asB = { Authorization: `Bearer ${tokenB}` };
  const asAdmin = { Authorization: `Bearer ${tokenAdmin}` };

  let createdRecordId = null;

  try {
    // 1. Dashboard
    const dashRes = await fetch(`${baseUrl}/doctor/dashboard`, { headers: asA });
    const dashBody = await dashRes.json();
    try {
      assert(dashRes.status === 200, `expected 200, got ${dashRes.status}`);
      assert(dashBody.stats.todayAppointments >= 1, 'expected at least 1 appointment today');
      assert(dashBody.stats.totalPatients >= 1, 'expected at least 1 patient');
      record('Dashboard returns real stats', true);
    } catch (err) {
      record('Dashboard returns real stats', false, err.message);
    }

    // 2. Profile get/update
    const profileRes = await fetch(`${baseUrl}/doctor/profile`, { headers: asA });
    const profileBody = await profileRes.json();
    try {
      assert(profileRes.status === 200, `expected 200, got ${profileRes.status}`);
      assert(profileBody.doctor.email === doctorAUser.email.toLowerCase(), 'expected matching email');
      assert(!containsSecrets(profileBody), 'must not include password/passwordHash');
      record('Doctor can view own profile', true);
    } catch (err) {
      record('Doctor can view own profile', false, err.message);
    }

    const updateProfileRes = await fetch(`${baseUrl}/doctor/profile`, {
      method: 'PUT',
      headers: { ...asA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999' }),
    });
    const updateProfileBody = await updateProfileRes.json();
    try {
      assert(updateProfileRes.status === 200, `expected 200, got ${updateProfileRes.status}`);
      assert(updateProfileBody.doctor.phone === '9999999999', 'expected updated phone');
      record('Doctor can update own phone', true);
    } catch (err) {
      record('Doctor can update own phone', false, err.message);
    }

    // 3. Patients list/detail + isolation from doctor B
    const patientsListRes = await fetch(`${baseUrl}/doctor/patients`, { headers: asA });
    const patientsListBody = await patientsListRes.json();
    try {
      assert(patientsListRes.status === 200, `expected 200, got ${patientsListRes.status}`);
      assert(patientsListBody.patients.some((p) => p.id === patient._id.toString()), 'expected the patient in the list');
      record('Doctor A sees their assigned patient', true);
    } catch (err) {
      record('Doctor A sees their assigned patient', false, err.message);
    }

    const patientDetailAsB = await fetch(`${baseUrl}/doctor/patients/${patient._id}`, { headers: asB });
    try {
      assert(patientDetailAsB.status === 403, `expected 403, got ${patientDetailAsB.status}`);
      record('Doctor B is blocked from a patient they never treated', true);
    } catch (err) {
      record('Doctor B is blocked from a patient they never treated', false, err.message);
    }

    // 4. Appointments list + status transitions
    const apptListRes = await fetch(`${baseUrl}/doctor/appointments?when=today`, { headers: asA });
    const apptListBody = await apptListRes.json();
    try {
      assert(apptListRes.status === 200, `expected 200, got ${apptListRes.status}`);
      assert(apptListBody.appointments.length >= 1, 'expected today’s appointment');
      record('Doctor sees own today’s appointments', true);
    } catch (err) {
      record('Doctor sees own today’s appointments', false, err.message);
    }

    const invalidTransitionRes = await fetch(`${baseUrl}/doctor/appointments/${appointment._id}/status`, {
      method: 'PATCH',
      headers: { ...asA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    try {
      assert(invalidTransitionRes.status === 400, `expected 400, got ${invalidTransitionRes.status}`);
      record('Invalid status transition (PENDING to COMPLETED) is rejected', true);
    } catch (err) {
      record('Invalid status transition (PENDING to COMPLETED) is rejected', false, err.message);
    }

    const validTransitionRes = await fetch(`${baseUrl}/doctor/appointments/${appointment._id}/status`, {
      method: 'PATCH',
      headers: { ...asA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const validTransitionBody = await validTransitionRes.json();
    try {
      assert(validTransitionRes.status === 200, `expected 200, got ${validTransitionRes.status}`);
      assert(validTransitionBody.appointment.status === 'CONFIRMED', 'expected CONFIRMED status');
      record('Valid status transition (PENDING to CONFIRMED) succeeds', true);
    } catch (err) {
      record('Valid status transition (PENDING to CONFIRMED) succeeds', false, err.message);
    }

    const otherDoctorStatusRes = await fetch(`${baseUrl}/doctor/appointments/${appointment._id}/status`, {
      method: 'PATCH',
      headers: { ...asB, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    try {
      assert(otherDoctorStatusRes.status === 404, `expected 404, got ${otherDoctorStatusRes.status}`);
      record('Doctor B cannot update Doctor A’s appointment', true);
    } catch (err) {
      record('Doctor B cannot update Doctor A’s appointment', false, err.message);
    }

    // 5. Dental records: create, list, unauthorized edit
    const createRecordRes = await fetch(`${baseUrl}/doctor/patients/${patient._id}/records`, {
      method: 'POST',
      headers: { ...asA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ chiefComplaint: 'Tooth sensitivity', diagnosis: 'Mild enamel erosion' }),
    });
    const createRecordBody = await createRecordRes.json();
    try {
      assert(createRecordRes.status === 201, `expected 201, got ${createRecordRes.status}`);
      createdRecordId = createRecordBody.record.id;
      record('Doctor can create a dental record', true);
    } catch (err) {
      record('Doctor can create a dental record', false, err.message);
    }

    const listRecordsRes = await fetch(`${baseUrl}/doctor/patients/${patient._id}/records`, { headers: asA });
    const listRecordsBody = await listRecordsRes.json();
    try {
      assert(listRecordsRes.status === 200, `expected 200, got ${listRecordsRes.status}`);
      assert(listRecordsBody.records.length >= 1, 'expected at least one record');
      record('Doctor can list patient dental records', true);
    } catch (err) {
      record('Doctor can list patient dental records', false, err.message);
    }

    const editOthersRecordRes = await fetch(`${baseUrl}/doctor/records/${createdRecordId}`, {
      method: 'PUT',
      headers: { ...asB, 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosis: 'Tampered' }),
    });
    try {
      // Doctor B has no relationship with this patient at all, so listing/
      // access is blocked earlier - but editing checks record authorship
      // directly, which correctly rejects with 403.
      assert(editOthersRecordRes.status === 403, `expected 403, got ${editOthersRecordRes.status}`);
      record('Doctor cannot edit a record they did not author', true);
    } catch (err) {
      record('Doctor cannot edit a record they did not author', false, err.message);
    }

    // 6. Treatments: create tied to the record, list
    const createTreatmentRes = await fetch(`${baseUrl}/doctor/patients/${patient._id}/treatments`, {
      method: 'POST',
      headers: { ...asA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dentalRecordId: createdRecordId, procedureName: 'Fluoride treatment', toothNumber: '14' }),
    });
    try {
      assert(createTreatmentRes.status === 201, `expected 201, got ${createTreatmentRes.status}`);
      record('Doctor can create a treatment linked to a record', true);
    } catch (err) {
      record('Doctor can create a treatment linked to a record', false, err.message);
    }

    const listTreatmentsRes = await fetch(`${baseUrl}/doctor/patients/${patient._id}/treatments`, { headers: asA });
    const listTreatmentsBody = await listTreatmentsRes.json();
    try {
      assert(listTreatmentsRes.status === 200 && listTreatmentsBody.treatments.length >= 1, 'expected 1+ treatment');
      record('Doctor can list patient treatments', true);
    } catch (err) {
      record('Doctor can list patient treatments', false, err.message);
    }

    // 7. Prescriptions: create tied to the record, list
    const createPrescriptionRes = await fetch(`${baseUrl}/doctor/patients/${patient._id}/prescriptions`, {
      method: 'POST',
      headers: { ...asA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dentalRecordId: createdRecordId,
        medicines: [{ name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice a day', durationDays: 5 }],
      }),
    });
    const createPrescriptionBody = await createPrescriptionRes.json();
    try {
      assert(createPrescriptionRes.status === 201, `expected 201, got ${createPrescriptionRes.status}`);
      assert(!containsSecrets(createPrescriptionBody), 'must not include password/passwordHash');
      record('Doctor can create a prescription linked to a record', true);
    } catch (err) {
      record('Doctor can create a prescription linked to a record', false, err.message);
    }

    // 8. Authorization: unauthenticated + admin blocked from doctor routes
    const noAuthRes = await fetch(`${baseUrl}/doctor/dashboard`);
    try {
      assert(noAuthRes.status === 401, `expected 401, got ${noAuthRes.status}`);
      record('Unauthenticated request to doctor portal is rejected', true);
    } catch (err) {
      record('Unauthenticated request to doctor portal is rejected', false, err.message);
    }

    const adminOnDoctorRes = await fetch(`${baseUrl}/doctor/dashboard`, { headers: asAdmin });
    try {
      assert(adminOnDoctorRes.status === 403, `expected 403, got ${adminOnDoctorRes.status}`);
      record('ADMIN role is blocked from doctor-portal routes', true);
    } catch (err) {
      record('ADMIN role is blocked from doctor-portal routes', false, err.message);
    }

    const doctorOnAdminRes = await fetch(`${baseUrl}/doctors`, { headers: asA });
    try {
      assert(doctorOnAdminRes.status === 403, `expected 403, got ${doctorOnAdminRes.status}`);
      record('DOCTOR role is still blocked from Admin Doctor Management', true);
    } catch (err) {
      record('DOCTOR role is still blocked from Admin Doctor Management', false, err.message);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));

    await Prescription.deleteMany({ patientId: patient._id });
    await Treatment.deleteMany({ patientId: patient._id });
    await DentalRecord.deleteMany({ patientId: patient._id });
    await Appointment.deleteMany({ patientId: patient._id });
    await Patient.deleteOne({ _id: patient._id });
    await Doctor.deleteMany({ _id: { $in: [doctorA._id, doctorB._id] } });
    await User.deleteMany({ _id: { $in: [doctorAUser._id, doctorBUser._id, adminUser._id] } });

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
