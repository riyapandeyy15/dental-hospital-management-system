const mongoose = require('mongoose');

const Appointment = require('../../models/Appointment');
const ApiError = require('../../utils/apiError');

// Only these transitions are allowed - a doctor cannot jump straight from
// PENDING to COMPLETED, and COMPLETED/CANCELLED are terminal states.
const ALLOWED_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toSafeAppointment(appt) {
  return {
    id: appt._id.toString(),
    patientId: appt.patientId?._id ? appt.patientId._id.toString() : appt.patientId?.toString(),
    patientName: appt.patientId?.name || null,
    patientPhone: appt.patientId?.phone || null,
    appointmentDate: appt.appointmentDate,
    startTime: appt.startTime,
    endTime: appt.endTime,
    status: appt.status,
    reason: appt.reason || null,
    notes: appt.notes || null,
    createdBy: appt.createdBy,
    createdAt: appt.createdAt,
  };
}

async function listAppointmentsForDoctor(doctorId, { when, status, patientId, search, page = 1, limit = 10 }) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const query = { doctorId };

  if (patientId) {
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      throw new ApiError(400, 'Invalid patient ID.');
    }
    query.patientId = patientId;
  }

  if (status) {
    query.status = status;
  }

  const now = new Date();
  if (when === 'today') {
    query.appointmentDate = { $gte: startOfDay(now), $lte: endOfDay(now) };
  } else if (when === 'upcoming') {
    query.appointmentDate = { $gt: endOfDay(now) };
  } else if (when === 'past') {
    query.appointmentDate = { $lt: startOfDay(now) };
  }

  let appointmentDocs = await Appointment.find(query)
    .sort({ appointmentDate: 1, startTime: 1 })
    .populate('patientId', 'name phone')
    .lean();

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    appointmentDocs = appointmentDocs.filter(
      (appt) =>
        appt.patientId?.name?.toLowerCase().includes(term) || appt.reason?.toLowerCase().includes(term)
    );
  }

  const total = appointmentDocs.length;
  const start = (pageNum - 1) * limitNum;
  const pageItems = appointmentDocs.slice(start, start + limitNum);

  return {
    appointments: pageItems.map(toSafeAppointment),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
    },
  };
}

async function getAppointmentForDoctor(doctorId, appointmentId) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new ApiError(400, 'Invalid appointment ID.');
  }

  const appointment = await Appointment.findOne({ _id: appointmentId, doctorId }).populate(
    'patientId',
    'name phone'
  );
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found.');
  }

  return toSafeAppointment(appointment.toObject());
}

async function updateAppointmentStatus(doctorId, appointmentId, nextStatus) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new ApiError(400, 'Invalid appointment ID.');
  }

  const appointment = await Appointment.findOne({ _id: appointmentId, doctorId }).populate(
    'patientId',
    'name phone'
  );
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found.');
  }

  const allowedNext = ALLOWED_TRANSITIONS[appointment.status] || [];
  if (!allowedNext.includes(nextStatus)) {
    throw new ApiError(400, `Cannot change status from ${appointment.status} to ${nextStatus}.`);
  }

  appointment.status = nextStatus;
  await appointment.save();

  return toSafeAppointment(appointment.toObject());
}

module.exports = {
  listAppointmentsForDoctor,
  getAppointmentForDoctor,
  updateAppointmentStatus,
  toSafeAppointment,
  ALLOWED_TRANSITIONS,
};
