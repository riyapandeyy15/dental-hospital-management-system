const { body, validationResult } = require('express-validator');

const appointmentService = require('./appointment.service');

async function list(req, res, next) {
  try {
    const { when, status, patientId, search, page, limit } = req.query;
    const result = await appointmentService.listAppointmentsForDoctor(req.doctorId, {
      when,
      status,
      patientId,
      search,
      page,
      limit,
    });
    res.status(200).json({ status: 'ok', ...result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const appointment = await appointmentService.getAppointmentForDoctor(req.doctorId, req.params.id);
    res.status(200).json({ status: 'ok', appointment });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
    }

    const appointment = await appointmentService.updateAppointmentStatus(
      req.doctorId,
      req.params.id,
      req.body.status
    );
    res.status(200).json({ status: 'ok', appointment });
  } catch (err) {
    next(err);
  }
}

const updateStatusValidators = [
  body('status')
    .isIn(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
    .withMessage('status must be one of PENDING, CONFIRMED, COMPLETED, CANCELLED.'),
];

module.exports = { list, getById, updateStatus, updateStatusValidators };
