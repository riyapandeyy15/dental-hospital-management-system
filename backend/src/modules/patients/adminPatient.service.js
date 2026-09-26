const mongoose = require('mongoose');

const Patient = require('../../models/Patient');
const Appointment = require('../../models/Appointment');
const ApiError = require('../../utils/apiError');
const { toSafePatient } = require('./patient.service');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listAllPatients({ search, status, page = 1, limit = 10 }) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const query = {};
  if (status === 'ACTIVE') query.isActive = true;
  if (status === 'INACTIVE') query.isActive = false;
  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    query.$or = [{ name: regex }, { phone: regex }, { email: regex }];
  }

  const [patients, total] = await Promise.all([
    Patient.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Patient.countDocuments(query),
  ]);

  return {
    patients: patients.map((p) => toSafePatient(p)),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
    },
  };
}

async function getPatientById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid patient ID.');
  }
  const patient = await Patient.findById(id);
  if (!patient) {
    throw new ApiError(404, 'Patient not found.');
  }

  const appointmentsCount = await Appointment.countDocuments({ patientId: id });
  return toSafePatient(patient.toObject(), { appointmentsCount });
}

// Admin-created patients are walk-in style records with no login account,
// matching the architecture already noted on the Patient model (userId is
// optional and only set when a patient later self-registers/links).
async function createPatient(payload) {
  const { name, phone, email, dateOfBirth, gender, address, emergencyContact } = payload;

  if (!name || !phone) {
    throw new ApiError(400, 'name and phone are required.');
  }

  const trimmedPhone = String(phone).trim();
  const existing = await Patient.findOne({ phone: trimmedPhone });
  if (existing) {
    throw new ApiError(409, 'A patient with this phone number already exists.');
  }

  const patient = await Patient.create({
    name: String(name).trim(),
    phone: trimmedPhone,
    email: email ? String(email).toLowerCase().trim() : undefined,
    dateOfBirth: dateOfBirth || undefined,
    gender: gender || undefined,
    address: address?.trim() || undefined,
    emergencyContact: emergencyContact
      ? {
          name: emergencyContact.name?.trim() || undefined,
          phone: emergencyContact.phone?.trim() || undefined,
          relation: emergencyContact.relation?.trim() || undefined,
        }
      : undefined,
  });

  return toSafePatient(patient.toObject());
}

async function updatePatient(id, payload) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid patient ID.');
  }

  const patient = await Patient.findById(id);
  if (!patient) {
    throw new ApiError(404, 'Patient not found.');
  }

  const { name, phone, email, dateOfBirth, gender, address, emergencyContact } = payload;

  if (phone !== undefined) {
    const trimmedPhone = String(phone).trim();
    if (trimmedPhone !== patient.phone) {
      const existing = await Patient.findOne({ phone: trimmedPhone, _id: { $ne: id } });
      if (existing) {
        throw new ApiError(409, 'A patient with this phone number already exists.');
      }
      patient.phone = trimmedPhone;
    }
  }
  if (name !== undefined) patient.name = String(name).trim();
  if (email !== undefined) patient.email = String(email).toLowerCase().trim();
  if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth || undefined;
  if (gender !== undefined) patient.gender = gender || undefined;
  if (address !== undefined) patient.address = address.trim();
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

async function setPatientStatus(id, isActive) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid patient ID.');
  }
  const patient = await Patient.findById(id);
  if (!patient) {
    throw new ApiError(404, 'Patient not found.');
  }
  patient.isActive = isActive;
  await patient.save();
  return toSafePatient(patient.toObject());
}

module.exports = { listAllPatients, getPatientById, createPatient, updatePatient, setPatientStatus };
