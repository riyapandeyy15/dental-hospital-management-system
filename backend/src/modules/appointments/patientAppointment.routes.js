const express = require('express');

const patientAppointmentController = require('./patientAppointment.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const attachPatientContext = require('../../middleware/patientContext');

const router = express.Router();

router.use(requireAuth, requireRole('PATIENT'), attachPatientContext);

router.get('/', patientAppointmentController.list);
router.post('/', patientAppointmentController.createValidators, patientAppointmentController.create);
router.get('/:id', patientAppointmentController.getById);
router.patch('/:id/cancel', patientAppointmentController.cancel);

module.exports = router;
