// Standalone check: connects to MongoDB, creates one temporary document per
// model to prove the schemas and references are valid, then deletes them
// all again. Does not touch or run the actual Express server.
//
// Run with: npm run verify:models

const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const DentalRecord = require('../src/models/DentalRecord');
const Treatment = require('../src/models/Treatment');
const Prescription = require('../src/models/Prescription');

async function run() {
  await connectDB();
  console.log('Connected. Creating one temporary document per model...\n');

  const adminUser = await User.create({
    name: 'Verify Script Admin',
    email: `verify-admin-${Date.now()}@example.com`,
    passwordHash: 'placeholder-hash',
    role: 'admin',
  });
  console.log('User model OK:', adminUser._id.toString());

  const doctorUser = await User.create({
    name: 'Verify Script Doctor',
    email: `verify-doctor-${Date.now()}@example.com`,
    passwordHash: 'placeholder-hash',
    role: 'doctor',
  });

  const doctor = await Doctor.create({
    userId: doctorUser._id,
    specialization: 'General Dentistry',
  });
  console.log('Doctor model OK:', doctor._id.toString());

  const patient = await Patient.create({
    name: 'Verify Script Patient',
    phone: `9${Date.now()}`.slice(0, 10),
  });
  console.log('Patient model OK:', patient._id.toString());

  const appointment = await Appointment.create({
    patientId: patient._id,
    doctorId: doctor._id,
    appointmentDate: new Date(),
    startTime: '10:00',
    endTime: '10:30',
  });
  console.log('Appointment model OK:', appointment._id.toString());

  const dentalRecord = await DentalRecord.create({
    patientId: patient._id,
    doctorId: doctor._id,
    appointmentId: appointment._id,
    chiefComplaint: 'Verification complaint',
  });
  console.log('DentalRecord model OK:', dentalRecord._id.toString());

  const treatment = await Treatment.create({
    dentalRecordId: dentalRecord._id,
    patientId: patient._id,
    doctorId: doctor._id,
    procedureName: 'Verification Procedure',
  });
  console.log('Treatment model OK:', treatment._id.toString());

  const prescription = await Prescription.create({
    dentalRecordId: dentalRecord._id,
    patientId: patient._id,
    doctorId: doctor._id,
    medicines: [{ name: 'Test Medicine', dosage: '500mg', frequency: 'Twice a day' }],
  });
  console.log('Prescription model OK:', prescription._id.toString());

  console.log('\nCleaning up temporary documents...');
  await Promise.all([
    User.deleteOne({ _id: adminUser._id }),
    User.deleteOne({ _id: doctorUser._id }),
    Doctor.deleteOne({ _id: doctor._id }),
    Patient.deleteOne({ _id: patient._id }),
    Appointment.deleteOne({ _id: appointment._id }),
    DentalRecord.deleteOne({ _id: dentalRecord._id }),
    Treatment.deleteOne({ _id: treatment._id }),
    Prescription.deleteOne({ _id: prescription._id }),
  ]);

  console.log('\nAll 7 models verified successfully. Temporary documents removed.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('\nModel verification FAILED:', err.message);
  process.exit(1);
});
