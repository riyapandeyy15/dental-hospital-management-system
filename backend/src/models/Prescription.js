const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    durationDays: { type: Number, min: 1 },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

// `issuedBy` is locked to 'doctor' and `doctorId` is required: a prescription
// can only ever be created by a doctor through the doctor-facing API. The AI
// assistant is never given a "create prescription" tool function, so it has
// no path to writing to this collection at all (see DESIGN.md section 7.3).
const prescriptionSchema = new mongoose.Schema(
  {
    dentalRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'DentalRecord', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    medicines: {
      type: [medicineSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'A prescription must include at least one medicine.',
      },
    },
    issuedDate: { type: Date, required: true, default: Date.now },
    issuedBy: {
      type: String,
      enum: ['doctor'],
      default: 'doctor',
      immutable: true,
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ dentalRecordId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
