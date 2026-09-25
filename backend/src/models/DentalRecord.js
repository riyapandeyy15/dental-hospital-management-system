const mongoose = require('mongoose');

// Clinical record for a single visit. `recordedBy` is locked to 'doctor' -
// this collection stores confirmed clinical findings only, never an AI
// assistant's output, so nothing here can be mistaken for an AI diagnosis.
const dentalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    visitDate: { type: Date, required: true, default: Date.now },
    chiefComplaint: { type: String, trim: true },
    clinicalNotes: { type: String, trim: true },
    diagnosis: { type: String, trim: true },
    followUp: {
      required: { type: Boolean, default: false },
      date: { type: Date },
      notes: { type: String, trim: true },
    },
    recordedBy: {
      type: String,
      enum: ['doctor'],
      default: 'doctor',
      immutable: true,
    },
  },
  { timestamps: true }
);

dentalRecordSchema.index({ patientId: 1, visitDate: -1 });

module.exports = mongoose.model('DentalRecord', dentalRecordSchema);
