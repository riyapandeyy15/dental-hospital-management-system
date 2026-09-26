// Doctor.availability has existed since Phase 2 but no UI ever set it, so
// no doctor has ever had bookable hours. This script gives the demo doctor
// a real weekly schedule (Mon-Fri, 9am-1pm and 2pm-5pm, 30-min slots) so
// Phase 7's booking flow has something genuine to book against. Doctors can
// also now set this themselves from their own Profile page.
//
// Run with: npm run seed:doctor-availability

const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');

const WEEKDAY_SCHEDULE = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
  { dayOfWeek: 1, startTime: '14:00', endTime: '17:00', slotDurationMinutes: 30 },
  { dayOfWeek: 2, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
  { dayOfWeek: 2, startTime: '14:00', endTime: '17:00', slotDurationMinutes: 30 },
  { dayOfWeek: 3, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
  { dayOfWeek: 3, startTime: '14:00', endTime: '17:00', slotDurationMinutes: 30 },
  { dayOfWeek: 4, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
  { dayOfWeek: 4, startTime: '14:00', endTime: '17:00', slotDurationMinutes: 30 },
  { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
  { dayOfWeek: 5, startTime: '14:00', endTime: '17:00', slotDurationMinutes: 30 },
];

async function run() {
  await connectDB();

  const doctorUser = await User.findOne({ email: 'doctor.test@dentalhms.local' });
  if (!doctorUser) {
    console.error('No doctor account found for doctor.test@dentalhms.local.');
    process.exit(1);
  }
  const doctor = await Doctor.findOne({ userId: doctorUser._id });
  if (!doctor) {
    console.error('That user has no linked Doctor profile.');
    process.exit(1);
  }

  doctor.availability = WEEKDAY_SCHEDULE;
  await doctor.save();

  console.log(`Set Mon-Fri 9-1 & 2-5 availability (30-min slots) for Dr. ${doctorUser.name}.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to seed doctor availability:', err.message);
  process.exit(1);
});
