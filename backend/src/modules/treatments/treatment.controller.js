const { body, validationResult } = require('express-validator');

const treatmentService = require('./treatment.service');

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ status: 'error', message: errors.array()[0].msg });
    return false;
  }
  return true;
}

async function listForPatient(req, res, next) {
  try {
    const treatments = await treatmentService.listTreatmentsForPatient(req.doctorId, req.params.patientId);
    res.status(200).json({ status: 'ok', treatments });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const treatment = await treatmentService.createTreatment(req.doctorId, req.params.patientId, req.body);
    res.status(201).json({ status: 'ok', treatment });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const treatment = await treatmentService.updateTreatment(req.doctorId, req.params.id, req.body);
    res.status(200).json({ status: 'ok', treatment });
  } catch (err) {
    next(err);
  }
}

const createValidators = [
  body('dentalRecordId').isMongoId().withMessage('A valid dentalRecordId is required.'),
  body('procedureName').isString().trim().notEmpty().withMessage('Procedure name is required.'),
  body('status').optional().isIn(['PLANNED', 'IN_PROGRESS', 'COMPLETED']),
  body('cost').optional({ checkFalsy: true }).isFloat({ min: 0 }),
];

const updateValidators = [
  body('procedureName').optional().isString().trim().notEmpty(),
  body('status').optional().isIn(['PLANNED', 'IN_PROGRESS', 'COMPLETED']),
  body('cost').optional({ checkFalsy: true }).isFloat({ min: 0 }),
];

module.exports = { listForPatient, create, update, createValidators, updateValidators };
