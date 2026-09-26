const express = require('express');

const dentalRecordController = require('./dentalRecord.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const attachDoctorContext = require('../../middleware/doctorContext');

const router = express.Router();

router.use(requireAuth, requireRole('DOCTOR'), attachDoctorContext);

router.get('/patients/:patientId/records', dentalRecordController.listForPatient);
router.post('/patients/:patientId/records', dentalRecordController.createValidators, dentalRecordController.create);
router.put('/records/:id', dentalRecordController.createValidators, dentalRecordController.update);

module.exports = router;
