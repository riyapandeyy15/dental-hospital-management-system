const express = require('express');

const adminPatientController = require('./adminPatient.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', adminPatientController.list);
router.get('/:id', adminPatientController.getById);
router.post('/', adminPatientController.createValidators, adminPatientController.create);
router.put('/:id', adminPatientController.updateValidators, adminPatientController.update);
router.patch('/:id/status', adminPatientController.statusValidators, adminPatientController.setStatus);

module.exports = router;
