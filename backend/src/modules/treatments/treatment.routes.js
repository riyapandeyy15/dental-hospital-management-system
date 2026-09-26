const express = require('express');

const treatmentController = require('./treatment.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const attachDoctorContext = require('../../middleware/doctorContext');

const router = express.Router();

router.use(requireAuth, requireRole('DOCTOR'), attachDoctorContext);

router.get('/patients/:patientId/treatments', treatmentController.listForPatient);
router.post('/patients/:patientId/treatments', treatmentController.createValidators, treatmentController.create);
router.put('/treatments/:id', treatmentController.updateValidators, treatmentController.update);

module.exports = router;
