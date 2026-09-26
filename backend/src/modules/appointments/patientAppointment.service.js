const mongoose = require('mongoose');

const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const Patient = require('../../models/Patient');
const ApiError = require('../../utils/apiError');
const { ALLOWED_TRANSITIONS } = require('./appointment.service');
const { findSlotBoundary, parseDateOnly } = require('./slot.service');

async function getPatientIdForUser(userId) {
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new ApiError(404, 'No patient profile is linked to this account.');
  }
  return patient._id.toString();
}

// The one shape every patient-facing appointment endpoint returns - doctor
// name/specialization resolved, never the doctor-portal's patient-centric
// projection. `appt` must have doctorId populated with its userId.name.
function toPatientSafeAppointment(appt) {
  return {
    id: appt._id.toString(),
    doctorId: appt.doctorId?._id?.toString(),
    doctorName: appt.doctorId?.userId?.name || 'Doctor',
    specialization: appt.doctorId?.specialization || null,
    appointmentDate: appt.appointmentDate,
    startTime: appt.startTime,
    endTime: appt.endTime,
    status: appt.status,
    reason: appt.reason || null,
    createdAt: appt.createdAt,
  };
}

// The single place a new appointment gets created, whether the request
// came from the patient portal or an admin booking on a patient's behalf.
// Every validation here runs on the server - never trust a client-supplied
// slot as already vetted.
async function createAppointment({ patientId, doctorId, appointmentDate, startTime, reason, createdBy }) {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new ApiError(400, 'Invalid doctor ID.');
  }
  if (!appointmentDate || Number.isNaN(new Date(appointmentDate).getTime())) {
    throw new ApiError(400, 'A valid appointmentDate is required.');
  }
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
    throw new ApiError(400, 'A valid startTime (HH:MM) is required.');
  }

  const requestedDate = parseDateOnly(appointmentDate);
  const today = parseDateOnly(new Date());
  if (requestedDate < today) {
    throw new ApiError(400, 'Cannot book an appointment in the past.');
  }

  const doctor = await Doctor.findOne({ _id: doctorId, isActive: true });
  if (!doctor) {
    throw new ApiError(404, 'Doctor not found or not currently accepting appointments.');
  }

  const boundary = findSlotBoundary(doctor.availability, appointmentDate, startTime);
  if (!boundary) {
    throw new ApiError(400, 'That time is not an available slot for this doctor on this date.');
  }

  try {
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate: requestedDate,
      startTime,
      endTime: boundary.endTime,
      reason: reason?.trim() || undefined,
      createdBy: createdBy || 'patient',
    });
    await appointment.populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });
    return toPatientSafeAppointment(appointment.toObject());
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'This time slot was just booked by someone else. Please choose another slot.');
    }
    throw err;
  }
}

async function listForPatient(patientId, { when, page = 1, limit = 10 }) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const query = { patientId };
  const today = parseDateOnly(new Date());

  if (when === 'upcoming') {
    query.appointmentDate = { $gte: today };
    query.status = { $in: ['PENDING', 'CONFIRMED'] };
  } else if (when === 'past') {
    query.$or = [{ appointmentDate: { $lt: today } }, { status: 'COMPLETED' }];
  } else if (when === 'cancelled') {
    query.status = 'CANCELLED';
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .sort({ appointmentDate: when === 'past' ? -1 : 1, startTime: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .lean(),
    Appointment.countDocuments(query),
  ]);

  return {
    appointments: appointments.map(toPatientSafeAppointment),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
    },
  };
}

async function getForPatient(patientId, appointmentId) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new ApiError(400, 'Invalid appointment ID.');
  }

  const appointment = await Appointment.findOne({ _id: appointmentId, patientId }).populate({
    path: 'doctorId',
    populate: { path: 'userId', select: 'name' },
  });
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found.');
  }

  return toPatientSafeAppointment(appointment.toObject());
}

// A patient may cancel a PENDING or CONFIRMED appointment - never mark one
// COMPLETED (that stays a clinical, doctor-driven action), and never cancel
// one that's already COMPLETED or CANCELLED.
async function cancelForPatient(patientId, appointmentId) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new ApiError(400, 'Invalid appointment ID.');
  }

  const appointment = await Appointment.findOne({ _id: appointmentId, patientId }).populate({
    path: 'doctorId',
    populate: { path: 'userId', select: 'name' },
  });
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found.');
  }

  if (!(ALLOWED_TRANSITIONS[appointment.status] || []).includes('CANCELLED')) {
    throw new ApiError(400, `An appointment that is ${appointment.status.toLowerCase()} cannot be cancelled.`);
  }

  appointment.status = 'CANCELLED';
  await appointment.save();
  return toPatientSafeAppointment(appointment.toObject());
}

module.exports = { getPatientIdForUser, createAppointment, listForPatient, getForPatient, cancelForPatient };
