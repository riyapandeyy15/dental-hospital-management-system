const express = require('express');

const patientSelfController = require('./patientSelf.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

const router = express.Router();

router.use(requireAuth, requireRole('PATIENT'));

router.get('/', patientSelfController.getMyProfile);
router.put('/', patientSelfController.updateMyProfileValidators, patientSelfController.updateMyProfile);

module.exports = router;
