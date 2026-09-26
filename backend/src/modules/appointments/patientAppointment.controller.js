const { body, validationResult } = require('express-validator');

const patientAppointmentService = require('./patientAppointment.service');

async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
    }

    const { doctorId, appointmentDate, startTime, reason } = req.body;
    const appointment = await patientAppointmentService.createAppointment({
      patientId: req.patientId,
      doctorId,
      appointmentDate,
      startTime,
      reason,
      createdBy: 'patient',
    });
    res.status(201).json({ status: 'ok', appointment });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { when, page, limit } = req.query;
    const result = await patientAppointmentService.listForPatient(req.patientId, { when, page, limit });
    res.status(200).json({ status: 'ok', ...result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const appointment = await patientAppointmentService.getForPatient(req.patientId, req.params.id);
    res.status(200).json({ status: 'ok', appointment });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const appointment = await patientAppointmentService.cancelForPatient(req.patientId, req.params.id);
    res.status(200).json({ status: 'ok', appointment });
  } catch (err) {
    next(err);
  }
}

const createValidators = [
  body('doctorId').isMongoId().withMessage('A valid doctorId is required.'),
  body('appointmentDate').isISO8601().withMessage('A valid appointmentDate is required.'),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('A valid startTime (HH:MM) is required.'),
  body('reason').optional({ checkFalsy: true }).isString(),
];

module.exports = { create, list, getById, cancel, createValidators };
