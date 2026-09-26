const express = require('express');

const prescriptionController = require('./prescription.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const attachDoctorContext = require('../../middleware/doctorContext');

const router = express.Router();

router.use(requireAuth, requireRole('DOCTOR'), attachDoctorContext);

router.get('/patients/:patientId/prescriptions', prescriptionController.listForPatient);
router.post(
  '/patients/:patientId/prescriptions',
  prescriptionController.createValidators,
  prescriptionController.create
);

module.exports = router;
