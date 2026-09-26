const mongoose = require('mongoose');

const Appointment = require('../../models/Appointment');
const Patient = require('../../models/Patient');
const ApiError = require('../../utils/apiError');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toSafePatient(patientPlain, extra = {}) {
  return {
    id: patientPlain._id.toString(),
    name: patientPlain.name,
    phone: patientPlain.phone,
    email: patientPlain.email || null,
    dateOfBirth: patientPlain.dateOfBirth || null,
    gender: patientPlain.gender || null,
    address: patientPlain.address || null,
    emergencyContact: patientPlain.emergencyContact || null,
    medicalHistory: patientPlain.medicalHistory || null,
    isActive: patientPlain.isActive,
    createdAt: patientPlain.createdAt,
    ...extra,
  };
}

// Lists only the patients this doctor has at least one appointment with -
// the only doctor/patient relationship the current data model defines.
async function listPatientsForDoctor(doctorId, { search, page = 1, limit = 10 }) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const pipeline = [
    { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
    {
      $group: {
        _id: '$patientId',
        lastAppointmentDate: { $max: '$appointmentDate' },
        appointmentsCount: { $sum: 1 },
      },
    },
    { $lookup: { from: 'patients', localField: '_id', foreignField: '_id', as: 'patient' } },
    { $unwind: '$patient' },
  ];

  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    pipeline.push({
      $match: {
        $or: [{ 'patient.name': regex }, { 'patient.phone': regex }, { 'patient.email': regex }],
      },
    });
  }

  pipeline.push(
    { $sort: { lastAppointmentDate: -1 } },
    {
      $facet: {
        data: [{ $skip: (pageNum - 1) * limitNum }, { $limit: limitNum }],
        totalCount: [{ $count: 'count' }],
      },
    }
  );

  const [result] = await Appointment.aggregate(pipeline);
  const patients = (result?.data || []).map((row) =>
    toSafePatient(row.patient, {
      lastAppointmentDate: row.lastAppointmentDate,
      appointmentsCount: row.appointmentsCount,
    })
  );
  const total = result?.totalCount?.[0]?.count || 0;

  return {
    patients,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
    },
  };
}

async function getPatientForDoctor(doctorId, patientId) {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new ApiError(400, 'Invalid patient ID.');
  }

  const hasRelationship = await Appointment.exists({ doctorId, patientId });
  if (!hasRelationship) {
    throw new ApiError(403, 'You do not have access to this patient.');
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, 'Patient not found.');
  }

  const [appointmentsCount, lastAppointment] = await Promise.all([
    Appointment.countDocuments({ doctorId, patientId }),
    Appointment.findOne({ doctorId, patientId }).sort({ appointmentDate: -1 }),
  ]);

  return toSafePatient(patient.toObject(), {
    appointmentsCount,
    lastAppointmentDate: lastAppointment?.appointmentDate || null,
  });
}

module.exports = { listPatientsForDoctor, getPatientForDoctor, toSafePatient };
