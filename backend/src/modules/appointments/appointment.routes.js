const express = require('express');

const appointmentController = require('./appointment.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const attachDoctorContext = require('../../middleware/doctorContext');

const router = express.Router();

// Doctor-facing appointment access only, always scoped to the
// authenticated doctor via req.doctorId - never a client-supplied doctor id.
router.use(requireAuth, requireRole('DOCTOR'), attachDoctorContext);

router.get('/', appointmentController.list);
router.get('/:id', appointmentController.getById);
router.patch('/:id/status', appointmentController.updateStatusValidators, appointmentController.updateStatus);

module.exports = router;
