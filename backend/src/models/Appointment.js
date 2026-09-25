const mongoose = require('mongoose');

const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentDate: { type: Date, required: true },
    startTime: { type: String, required: true }, // e.g. "10:00"
    endTime: { type: String, required: true }, // e.g. "10:30"
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: 'PENDING',
    },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: {
      type: String,
      enum: ['admin', 'doctor', 'patient', 'ai'],
      default: 'admin',
    },
  },
  { timestamps: true }
);

// Speeds up the common "find this doctor's appointments on this date" query
// and slot-availability checks.
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ patientId: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
module.exports.APPOINTMENT_STATUSES = APPOINTMENT_STATUSES;
