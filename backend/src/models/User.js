const mongoose = require('mongoose');

const ROLES = ['ADMIN', 'DOCTOR', 'PATIENT'];

// Authentication identity for all three roles. This is the only place
// passwordHash and role live - Doctor/Patient store a reference here rather
// than duplicating them.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
