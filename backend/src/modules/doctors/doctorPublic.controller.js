const mongoose = require('mongoose');

const doctorService = require('./doctor.service');
const Doctor = require('../../models/Doctor');
const Appointment = require('../../models/Appointment');
const ApiError = require('../../utils/apiError');
const { generateSlotsForDate, parseDateOnly } = require('../appointments/slot.service');

async function list(req, res, next) {
  try {
    const { search, specialization, page, limit } = req.query;
    const result = await doctorService.listPublicDoctors({ search, specialization, page, limit });
    res.status(200).json({ status: 'ok', ...result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const doctor = await doctorService.getPublicDoctorById(req.params.id);
    res.status(200).json({ status: 'ok', doctor });
  } catch (err) {
    next(err);
  }
}

async function getAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid doctor ID.');
    }
    if (!date || Number.isNaN(new Date(date).getTime())) {
      throw new ApiError(400, 'A valid date query parameter (YYYY-MM-DD) is required.');
    }

    const doctor = await Doctor.findOne({ _id: id, isActive: true });
    if (!doctor) {
      throw new ApiError(404, 'Doctor not found.');
    }

    const dayStart = parseDateOnly(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctorId: id,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    }).select('startTime');

    const bookedTimes = new Set(existingAppointments.map((a) => a.startTime));
    const slots = generateSlotsForDate(doctor.availability, date, bookedTimes);

    res.status(200).json({ status: 'ok', date, slots });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, getAvailability };
