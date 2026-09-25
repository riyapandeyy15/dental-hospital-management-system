const mongoose = require('mongoose');

// Professional profile for a doctor. Login identity (name/email/password)
// lives on the linked User document, not here, to avoid duplicating it.
const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: { type: String, required: true, trim: true },
    qualifications: [{ type: String, trim: true }],
    registrationNumber: { type: String, trim: true },
    experienceYears: { type: Number, min: 0 },
    phone: { type: String, trim: true },
    availability: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday ... 6 = Saturday
        startTime: { type: String, required: true }, // e.g. "09:00"
        endTime: { type: String, required: true }, // e.g. "17:00"
        slotDurationMinutes: { type: Number, default: 30, min: 5 },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
