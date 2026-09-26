const mongoose = require('mongoose');

const Appointment = require('../../models/Appointment');
const ApiError = require('../../utils/apiError');
const { ALLOWED_TRANSITIONS } = require('./appointment.service');
const { createAppointment: createAppointmentShared } = require('./patientAppointment.service');
const { parseDateOnly } = require('./slot.service');

function toSafeAdminAppointment(appt) {
  return {
    id: appt._id.toString(),
    patientId: appt.patientId?._id?.toString() || appt.patientId?.toString(),
    patientName: appt.patientId?.name || null,
    patientPhone: appt.patientId?.phone || null,
    doctorId: appt.doctorId?._id?.toString() || appt.doctorId?.toString(),
    doctorName: appt.doctorId?.userId?.name || null,
    specialization: appt.doctorId?.specialization || null,
    appointmentDate: appt.appointmentDate,
    startTime: appt.startTime,
    endTime: appt.endTime,
    status: appt.status,
    reason: appt.reason || null,
    createdBy: appt.createdBy,
    createdAt: appt.createdAt,
  };
}

async function listAllAppointments({ doctorId, patientId, status, date, search, page = 1, limit = 10 }) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const query = {};
  if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) query.doctorId = doctorId;
  if (patientId && mongoose.Types.ObjectId.isValid(patientId)) query.patientId = patientId;
  if (status) query.status = status;
  if (date) {
    const dayStart = parseDateOnly(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: dayStart, $lte: dayEnd };
  }

  let appointments = await Appointment.find(query)
    .sort({ appointmentDate: -1, startTime: 1 })
    .populate('patientId', 'name phone')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .lean();

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    appointments = appointments.filter(
      (appt) =>
        appt.patientId?.name?.toLowerCase().includes(term) ||
        appt.doctorId?.userId?.name?.toLowerCase().includes(term)
    );
  }

  const total = appointments.length;
  const start = (pageNum - 1) * limitNum;
  const pageItems = appointments.slice(start, start + limitNum);

  return {
    appointments: pageItems.map(toSafeAdminAppointment),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
    },
  };
}

async function getAppointmentById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid appointment ID.');
  }
  const appointment = await Appointment.findById(id)
    .populate('patientId', 'name phone')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found.');
  }
  return toSafeAdminAppointment(appointment.toObject());
}

// Reuses the exact same booking/conflict logic as patient self-booking, so
// an admin booking on a patient's behalf can never bypass availability or
// double-booking rules.
async function createAppointmentAsAdmin({ patientId, doctorId, appointmentDate, startTime, reason }) {
  if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
    throw new ApiError(400, 'A valid patientId is required.');
  }
  const appointment = await createAppointmentShared({
    patientId,
    doctorId,
    appointmentDate,
    startTime,
    reason,
    createdBy: 'admin',
  });
  return appointment;
}

async function updateStatus(id, nextStatus) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid appointment ID.');
  }

  const appointment = await Appointment.findById(id)
    .populate('patientId', 'name phone')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found.');
  }

  const allowedNext = ALLOWED_TRANSITIONS[appointment.status] || [];
  if (!allowedNext.includes(nextStatus)) {
    throw new ApiError(400, `Cannot change status from ${appointment.status} to ${nextStatus}.`);
  }

  appointment.status = nextStatus;
  await appointment.save();
  return toSafeAdminAppointment(appointment.toObject());
}

module.exports = { listAllAppointments, getAppointmentById, createAppointmentAsAdmin, updateStatus };
