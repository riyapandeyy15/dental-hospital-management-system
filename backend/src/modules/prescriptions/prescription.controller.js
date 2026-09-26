const { body, validationResult } = require('express-validator');

const prescriptionService = require('./prescription.service');

async function listForPatient(req, res, next) {
  try {
    const prescriptions = await prescriptionService.listPrescriptionsForPatient(
      req.doctorId,
      req.params.patientId
    );
    res.status(200).json({ status: 'ok', prescriptions });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
    }

    const prescription = await prescriptionService.createPrescription(
      req.doctorId,
      req.params.patientId,
      req.body
    );
    res.status(201).json({ status: 'ok', prescription });
  } catch (err) {
    next(err);
  }
}

const createValidators = [
  body('dentalRecordId').isMongoId().withMessage('A valid dentalRecordId is required.'),
  body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required.'),
];

module.exports = { listForPatient, create, createValidators };
