const Patient = require('../../models/Patient');
const User = require('../../models/User');
const ApiError = require('../../utils/apiError');
const { toSafePatient } = require('./patient.service');

async function getMyProfile(userId) {
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new ApiError(404, 'No patient profile is linked to this account.');
  }
  return toSafePatient(patient.toObject());
}

// A patient may update their own contact details, but never their medical
// history (allergies/conditions/notes) or dental records - those remain
// doctor-authored clinical data (see Phase 6 dentalRecords module).
async function updateMyProfile(userId, payload) {
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new ApiError(404, 'No patient profile is linked to this account.');
  }

  const { name, phone, email, address, dateOfBirth, gender, emergencyContact } = payload;

  if (name !== undefined) {
    const trimmedName = String(name).trim();
    patient.name = trimmedName;
    await User.updateOne({ _id: userId }, { name: trimmedName });
  }
  if (phone !== undefined) {
    const trimmedPhone = String(phone).trim();
    const existing = await Patient.findOne({ phone: trimmedPhone, _id: { $ne: patient._id } });
    if (existing) {
      throw new ApiError(409, 'Another account already uses this phone number.');
    }
    patient.phone = trimmedPhone;
  }
  if (email !== undefined) patient.email = String(email).toLowerCase().trim();
  if (address !== undefined) patient.address = String(address).trim();
  if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth || undefined;
  if (gender !== undefined) patient.gender = gender || undefined;
  if (emergencyContact !== undefined) {
    patient.emergencyContact = {
      name: emergencyContact.name?.trim() || undefined,
      phone: emergencyContact.phone?.trim() || undefined,
      relation: emergencyContact.relation?.trim() || undefined,
    };
  }

  await patient.save();
  return toSafePatient(patient.toObject());
}

module.exports = { getMyProfile, updateMyProfile };
