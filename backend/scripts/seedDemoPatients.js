// Phase 6 needs real patients/appointments to demonstrate the Doctor Module
// against, but no Patient/Appointment creation UI exists yet in any earlier
// phase (that's an Admin module for a later phase). This script creates a
// small set of real, idempotent demo records so the doctor portal has
// something genuine to show - not fake data rendered in the UI, but real
// MongoDB documents you can inspect, edit or delete like any other record.
//
// Run with: npm run seed:demo-patients

const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const Doctor = require('../src/models/Doctor');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');

function todayAt(hours, minutes) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function findOrCreatePatient(data) {
  let patient = await Patient.findOne({ phone: data.phone });
  if (!patient) {
    patient = await Patient.create(data);
    console.log(`  Created patient: ${patient.name}`);
  } else {
    console.log(`  Patient already exists: ${patient.name}`);
  }
  return patient;
}

async function findOrCreateAppointment(data) {
  const existing = await Appointment.findOne({
    doctorId: data.doctorId,
    patientId: data.patientId,
    appointmentDate: data.appointmentDate,
    startTime: data.startTime,
  });
  if (existing) {
    console.log(`  Appointment already exists on ${data.appointmentDate.toDateString()} at ${data.startTime}`);
    return existing;
  }
  const appointment = await Appointment.create(data);
  console.log(`  Created appointment on ${data.appointmentDate.toDateString()} at ${data.startTime} (${data.status})`);
  return appointment;
}

async function run() {
  await connectDB();

  const doctorUser = await User.findOne({ email: 'doctor.test@dentalhms.local' });
  if (!doctorUser) {
    console.error(
      'No doctor account found for doctor.test@dentalhms.local. Log in as a doctor at least once, or seed one first.'
    );
    process.exit(1);
  }
  const doctor = await Doctor.findOne({ userId: doctorUser._id });
  if (!doctor) {
    console.error('That user has no linked Doctor profile.');
    process.exit(1);
  }

  console.log(`Seeding demo patients/appointments for Dr. ${doctorUser.name} (${doctorUser.email})...\n`);

  const patientA = await findOrCreatePatient({
    name: 'Anita Sharma',
    phone: '9812345001',
    email: 'anita.sharma@example.com',
    dateOfBirth: new Date('1990-04-12'),
    gender: 'female',
    address: '12 MG Road, Pune',
    medicalHistory: { allergies: ['Penicillin'], conditions: [], notes: 'Sensitive to cold water.' },
  });

  const patientB = await findOrCreatePatient({
    name: 'Rohan Verma',
    phone: '9812345002',
    email: 'rohan.verma@example.com',
    dateOfBirth: new Date('1985-11-02'),
    gender: 'male',
    address: '45 Park Street, Pune',
  });

  console.log('');

  await findOrCreateAppointment({
    doctorId: doctor._id,
    patientId: patientA._id,
    appointmentDate: todayAt(0, 0),
    startTime: '10:00',
    endTime: '10:30',
    status: 'CONFIRMED',
    reason: 'Routine check-up',
    createdBy: 'admin',
  });

  await findOrCreateAppointment({
    doctorId: doctor._id,
    patientId: patientB._id,
    appointmentDate: todayAt(0, 0),
    startTime: '14:00',
    endTime: '14:30',
    status: 'PENDING',
    reason: 'Tooth pain',
    createdBy: 'admin',
  });

  await findOrCreateAppointment({
    doctorId: doctor._id,
    patientId: patientA._id,
    appointmentDate: daysFromNow(5),
    startTime: '11:00',
    endTime: '11:30',
    status: 'CONFIRMED',
    reason: 'Follow-up',
    createdBy: 'admin',
  });

  await findOrCreateAppointment({
    doctorId: doctor._id,
    patientId: patientB._id,
    appointmentDate: daysFromNow(-3),
    startTime: '09:00',
    endTime: '09:30',
    status: 'COMPLETED',
    reason: 'Cavity filling',
    createdBy: 'admin',
  });

  console.log('\nDone. Log in as the doctor to see this data in the Doctor Module.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to seed demo data:', err.message);
  process.exit(1);
});
