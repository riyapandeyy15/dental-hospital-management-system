const { body, validationResult } = require('express-validator');

const dentalRecordService = require('./dentalRecord.service');

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
    const records = await dentalRecordService.listRecordsForPatient(req.doctorId, req.params.patientId);
    res.status(200).json({ status: 'ok', records });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const record = await dentalRecordService.createRecord(req.doctorId, req.params.patientId, req.body);
    res.status(201).json({ status: 'ok', record });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const record = await dentalRecordService.updateRecord(req.doctorId, req.params.id, req.body);
    res.status(200).json({ status: 'ok', record });
  } catch (err) {
    next(err);
  }
}

const createValidators = [
  body('chiefComplaint').optional({ checkFalsy: true }).isString(),
  body('clinicalNotes').optional({ checkFalsy: true }).isString(),
  body('diagnosis').optional({ checkFalsy: true }).isString(),
];

module.exports = { listForPatient, create, update, createValidators };
