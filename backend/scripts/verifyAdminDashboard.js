// End-to-end check of the Phase 8 Admin Dashboard/Reports endpoint. Creates
// its own temporary doctor/patient/appointments with known statuses, hits
// the real HTTP endpoint, asserts the aggregated numbers reflect exactly
// what was created, then cleans everything up.
//
// Run with: npm run verify:admin-dashboard

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

function toLocalDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  await connectDB();
  const suffix = Date.now();

  const doctorUser = await User.create({
    name: 'Verify AD Doctor',
    email: `verify-ad-doctor-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-AD-Doctor-1!'),
    role: 'DOCTOR',
  });
  const doctor = await Doctor.create({
    userId: doctorUser._id,
    specialization: 'Orthodontics',
    isActive: true,
    availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '11:00', slotDurationMinutes: 30 }],
  });

  const adminUser = await User.create({
    name: 'Verify AD Admin',
    email: `verify-ad-admin-${suffix}@example.com`,
    passwordHash: await hashPassword('Verify-AD-Admin-1!'),
    role: 'ADMIN',
  });
  const adminToken = generateToken(adminUser);

  const doctorToken = generateToken(doctorUser);

  const patient = await Patient.create({
    name: 'Verify AD Patient',
    phone: `6${suffix}`.slice(0, 10),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointments = await Appointment.create([
    { patientId: patient._id, doctorId: doctor._id, appointmentDate: today, startTime: '09:00', endTime: '09:30', status: 'PENDING' },
    { patientId: patient._id, doctorId: doctor._id, appointmentDate: today, startTime: '10:00', endTime: '10:30', status: 'CONFIRMED' },
    { patientId: patient._id, doctorId: doctor._id, appointmentDate: today, startTime: '10:30', endTime: '11:00', status: 'COMPLETED' },
  ]);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  const asAdmin = { Authorization: `Bearer ${adminToken}` };
  const asDoctor = { Authorization: `Bearer ${doctorToken}` };

  try {
    // 1. Admin can load the dashboard and gets real numbers, not placeholders.
    const dashRes = await fetch(`${baseUrl}/admin/dashboard`, { headers: asAdmin });
    const dashBody = await dashRes.json();
    try {
      assert(dashRes.status === 200, `expected 200, got ${dashRes.status}`);
      assert(dashBody.stats.totalPatients >= 1, 'expected at least our seeded patient');
      assert(dashBody.stats.totalDoctors >= 1, 'expected at least our seeded doctor');
      assert(dashBody.stats.pendingAppointments >= 1, 'expected at least our PENDING appointment');
      assert(dashBody.stats.confirmedAppointments >= 1, 'expected at least our CONFIRMED appointment');
      assert(dashBody.stats.completedAppointments >= 1, 'expected at least our COMPLETED appointment');
      assert(dashBody.stats.todayAppointments >= 3, 'expected our 3 seeded appointments counted today');
      record('Admin dashboard returns real aggregate stats', true);
    } catch (err) {
      record('Admin dashboard returns real aggregate stats', false, err.message);
    }

    // 2. Status breakdown sums to totalAppointments and matches known counts.
    try {
      const sb = dashBody.statusBreakdown;
      const sum = sb.PENDING + sb.CONFIRMED + sb.COMPLETED + sb.CANCELLED;
      assert(sum === dashBody.stats.totalAppointments, 'status breakdown must sum to totalAppointments');
      assert(sb.PENDING >= 1 && sb.CONFIRMED >= 1 && sb.COMPLETED >= 1, 'expected our three statuses represented');
      record('Status breakdown is internally consistent', true);
    } catch (err) {
      record('Status breakdown is internally consistent', false, err.message);
    }

    // 3. Appointments trend includes today with our 3 appointments counted.
    try {
      const todayKey = toLocalDateStr(today);
      const todayEntry = dashBody.appointmentsTrend.find((row) => row.date === todayKey);
      assert(todayEntry, 'expected a trend entry for today');
      assert(todayEntry.count >= 3, `expected >=3 for today, got ${todayEntry.count}`);
      assert(dashBody.appointmentsTrend.length === 14, `expected 14 trend days, got ${dashBody.appointmentsTrend.length}`);
      record('Appointments trend includes today with correct count', true);
    } catch (err) {
      record('Appointments trend includes today with correct count', false, err.message);
    }

    // 4. Doctor load includes our doctor with the right name and count.
    try {
      const row = dashBody.doctorLoad.find((d) => d.doctorId === doctor._id.toString());
      assert(row, 'expected our doctor in doctor load');
      assert(row.name === 'Verify AD Doctor', `expected doctor name, got ${row.name}`);
      assert(row.count >= 3, `expected our 3 appointments counted, got ${row.count}`);
      record('Doctor load ranks our doctor with correct name/count', true);
    } catch (err) {
      record('Doctor load ranks our doctor with correct name/count', false, err.message);
    }

    // 5. Doctor role is blocked from the admin dashboard.
    const doctorOnAdminRes = await fetch(`${baseUrl}/admin/dashboard`, { headers: asDoctor });
    try {
      assert(doctorOnAdminRes.status === 403, `expected 403, got ${doctorOnAdminRes.status}`);
      record('Doctor role is blocked from Admin Dashboard', true);
    } catch (err) {
      record('Doctor role is blocked from Admin Dashboard', false, err.message);
    }

    // 6. Unauthenticated request is rejected.
    const anonRes = await fetch(`${baseUrl}/admin/dashboard`);
    try {
      assert(anonRes.status === 401, `expected 401, got ${anonRes.status}`);
      record('Unauthenticated request is rejected', true);
    } catch (err) {
      record('Unauthenticated request is rejected', false, err.message);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));

    await Appointment.deleteMany({ _id: { $in: appointments.map((a) => a._id) } });
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
