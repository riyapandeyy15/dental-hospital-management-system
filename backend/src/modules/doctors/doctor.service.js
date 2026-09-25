const mongoose = require('mongoose');

const Doctor = require('../../models/Doctor');
const User = require('../../models/User');
const ApiError = require('../../utils/apiError');
const { hashPassword } = require('../auth/auth.service');

// Never include passwordHash - doctorPlain/userPlain are plain objects
// (from .toObject() or an aggregation stage), not Mongoose documents.
function toSafeDoctor(doctorPlain, userPlain) {
  return {
    id: doctorPlain._id.toString(),
    name: userPlain.name,
    email: userPlain.email,
    isActive: doctorPlain.isActive,
    phone: doctorPlain.phone,
    specialization: doctorPlain.specialization,
    qualifications: doctorPlain.qualifications || [],
    registrationNumber: doctorPlain.registrationNumber,
    experienceYears: doctorPlain.experienceYears,
    createdAt: doctorPlain.createdAt,
    updatedAt: doctorPlain.updatedAt,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listDoctors({ search, status, page = 1, limit = 10 }) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const pipeline = [
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
  ];

  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    pipeline.push({
      $match: {
        $or: [{ 'user.name': regex }, { 'user.email': regex }, { specialization: regex }],
      },
    });
  }

  if (status === 'ACTIVE') pipeline.push({ $match: { isActive: true } });
  if (status === 'INACTIVE') pipeline.push({ $match: { isActive: false } });

  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [{ $skip: (pageNum - 1) * limitNum }, { $limit: limitNum }],
        totalCount: [{ $count: 'count' }],
      },
    }
  );

  const [result] = await Doctor.aggregate(pipeline);
  const doctors = (result?.data || []).map((doc) => toSafeDoctor(doc, doc.user));
  const totalMatching = result?.totalCount?.[0]?.count || 0;

  // Stats reflect ALL doctors, independent of the search/status filter above,
  // so the Admin Dashboard can show true totals regardless of what's being
  // searched for on the Doctor Management page.
  const [total, active] = await Promise.all([
    Doctor.countDocuments({}),
    Doctor.countDocuments({ isActive: true }),
  ]);

  return {
    doctors,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalMatching,
      totalPages: Math.max(Math.ceil(totalMatching / limitNum), 1),
    },
    stats: { total, active, inactive: total - active },
  };
}

async function getDoctorById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid doctor ID.');
  }

  const doctor = await Doctor.findById(id).populate('userId');
  if (!doctor || !doctor.userId) {
    throw new ApiError(404, 'Doctor not found.');
  }

  const doctorObj = doctor.toObject();
  const userObj = doctorObj.userId;
  return toSafeDoctor(doctorObj, userObj);
}

async function createDoctor(payload) {
  const { name, email, password, phone, specialization, qualifications, registrationNumber, experienceYears } =
    payload;

  if (!name || !email || !password || !specialization) {
    throw new ApiError(400, 'name, email, password and specialization are required.');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long.');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const trimmedRegistration = registrationNumber ? String(registrationNumber).trim() : undefined;

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  if (trimmedRegistration) {
    const existingReg = await Doctor.findOne({ registrationNumber: trimmedRegistration });
    if (existingReg) {
      throw new ApiError(409, 'A doctor with this registration number already exists.');
    }
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'DOCTOR',
  });

  let doctor;
  try {
    doctor = await Doctor.create({
      userId: user._id,
      specialization: String(specialization).trim(),
      qualifications: Array.isArray(qualifications) ? qualifications.filter(Boolean) : [],
      registrationNumber: trimmedRegistration || undefined,
      experienceYears:
        experienceYears !== undefined && experienceYears !== '' ? Number(experienceYears) : undefined,
      phone: phone ? String(phone).trim() : undefined,
    });
  } catch (err) {
    // Roll back the User we just created so a failed Doctor profile never
    // leaves behind an orphaned login account with no profile.
    await User.deleteOne({ _id: user._id });
    if (err.code === 11000) {
      throw new ApiError(409, 'A doctor with this registration number already exists.');
    }
    throw err;
  }

  return toSafeDoctor(doctor.toObject(), user.toObject());
}

async function updateDoctor(id, payload) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid doctor ID.');
  }

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    throw new ApiError(404, 'Doctor not found.');
  }

  const user = await User.findById(doctor.userId);
  if (!user) {
    throw new ApiError(404, 'Linked user account not found.');
  }

  const { name, email, phone, specialization, qualifications, registrationNumber, experienceYears } = payload;

  if (email !== undefined) {
    const normalizedEmail = String(email).toLowerCase().trim();
    if (normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (existing) {
        throw new ApiError(409, 'An account with this email already exists.');
      }
      user.email = normalizedEmail;
    }
  }

  if (registrationNumber !== undefined) {
    const trimmedRegistration = String(registrationNumber).trim();
    if (trimmedRegistration !== (doctor.registrationNumber || '')) {
      if (trimmedRegistration) {
        const existingReg = await Doctor.findOne({
          registrationNumber: trimmedRegistration,
          _id: { $ne: doctor._id },
        });
        if (existingReg) {
          throw new ApiError(409, 'A doctor with this registration number already exists.');
        }
      }
      doctor.registrationNumber = trimmedRegistration || undefined;
    }
  }

  if (name !== undefined) user.name = String(name).trim();
  if (phone !== undefined) doctor.phone = String(phone).trim();
  if (specialization !== undefined) doctor.specialization = String(specialization).trim();
  if (qualifications !== undefined) {
    doctor.qualifications = Array.isArray(qualifications) ? qualifications.filter(Boolean) : [];
  }
  if (experienceYears !== undefined) {
    doctor.experienceYears = experienceYears === '' ? undefined : Number(experienceYears);
  }

  await user.save();
  await doctor.save();

  return toSafeDoctor(doctor.toObject(), user.toObject());
}

async function setDoctorStatus(id, isActive) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid doctor ID.');
  }
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be true or false.');
  }

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    throw new ApiError(404, 'Doctor not found.');
  }

  doctor.isActive = isActive;
  await doctor.save();

  // Mirror the status onto the User account too - isActive there is what
  // actually blocks login (see middleware/auth.js), so a "deactivated"
  // doctor must not still be able to sign in.
  await User.updateOne({ _id: doctor.userId }, { isActive });
  const user = await User.findById(doctor.userId);

  return toSafeDoctor(doctor.toObject(), user.toObject());
}

module.exports = {
  listDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  setDoctorStatus,
  toSafeDoctor,
};
