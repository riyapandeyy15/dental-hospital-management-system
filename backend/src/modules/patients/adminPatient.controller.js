const { body, validationResult } = require('express-validator');

const adminPatientService = require('./adminPatient.service');

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
    const { search, status, page, limit } = req.query;
    const result = await adminPatientService.listAllPatients({ search, status, page, limit });
    res.status(200).json({ status: 'ok', ...result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const patient = await adminPatientService.getPatientById(req.params.id);
    res.status(200).json({ status: 'ok', patient });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const patient = await adminPatientService.createPatient(req.body);
    res.status(201).json({ status: 'ok', patient });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const patient = await adminPatientService.updatePatient(req.params.id, req.body);
    res.status(200).json({ status: 'ok', patient });
  } catch (err) {
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const patient = await adminPatientService.setPatientStatus(req.params.id, req.body.isActive);
    res.status(200).json({ status: 'ok', patient });
  } catch (err) {
    next(err);
  }
}

const createValidators = [
  body('name').isString().trim().notEmpty().withMessage('Name is required.'),
  body('phone').isString().trim().notEmpty().withMessage('Phone is required.'),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']),
];

const updateValidators = [
  body('name').optional().isString().trim().notEmpty(),
  body('phone').optional().isString().trim().notEmpty(),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']),
];

const statusValidators = [body('isActive').isBoolean().withMessage('isActive must be true or false.')];

module.exports = { list, getById, create, update, setStatus, createValidators, updateValidators, statusValidators };
