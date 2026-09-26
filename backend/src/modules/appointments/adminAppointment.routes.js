const express = require('express');

const adminAppointmentController = require('./adminAppointment.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', adminAppointmentController.list);
router.get('/:id', adminAppointmentController.getById);
router.post('/', adminAppointmentController.createValidators, adminAppointmentController.create);
router.patch('/:id/status', adminAppointmentController.updateStatusValidators, adminAppointmentController.updateStatus);

module.exports = router;
