const { body, validationResult } = require('express-validator');

const adminAppointmentService = require('./adminAppointment.service');

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ status: 'error', message: errors.array()[0].msg });
    return false;
  }
  return true;
}

async function list(req, res, next) {
  try {
    const { doctorId, patientId, status, date, search, page, limit } = req.query;
    const result = await adminAppointmentService.listAllAppointments({
      doctorId,
      patientId,
      status,
      date,
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
    const appointment = await adminAppointmentService.getAppointmentById(req.params.id);
    res.status(200).json({ status: 'ok', appointment });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const { patientId, doctorId, appointmentDate, startTime, reason } = req.body;
    const appointment = await adminAppointmentService.createAppointmentAsAdmin({
      patientId,
      doctorId,
      appointmentDate,
      startTime,
      reason,
    });
    res.status(201).json({ status: 'ok', appointment });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const appointment = await adminAppointmentService.updateStatus(req.params.id, req.body.status);
    res.status(200).json({ status: 'ok', appointment });
  } catch (err) {
    next(err);
  }
}

const createValidators = [
  body('patientId').isMongoId().withMessage('A valid patientId is required.'),
  body('doctorId').isMongoId().withMessage('A valid doctorId is required.'),
  body('appointmentDate').isISO8601().withMessage('A valid appointmentDate is required.'),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('A valid startTime (HH:MM) is required.'),
];

const updateStatusValidators = [
  body('status')
    .isIn(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
    .withMessage('status must be one of PENDING, CONFIRMED, COMPLETED, CANCELLED.'),
];

module.exports = { list, getById, create, updateStatus, createValidators, updateStatusValidators };
