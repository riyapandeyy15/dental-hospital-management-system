const mongoose = require('mongoose');

const TREATMENT_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'];

// A specific procedure performed (or planned) as part of a dental record.
// Kept as its own collection (rather than an embedded array on
// DentalRecord) so a single visit can have several treatments tracked and
// updated independently over time.
const treatmentSchema = new mongoose.Schema(
  {
    dentalRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'DentalRecord', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    procedureName: { type: String, required: true, trim: true },
    toothNumber: { type: String, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: TREATMENT_STATUSES,
      default: 'PLANNED',
    },
    performedDate: { type: Date },
    cost: { type: Number, min: 0 },
  },
  { timestamps: true }
);

treatmentSchema.index({ patientId: 1 });
treatmentSchema.index({ dentalRecordId: 1 });

module.exports = mongoose.model('Treatment', treatmentSchema);
module.exports.TREATMENT_STATUSES = TREATMENT_STATUSES;
