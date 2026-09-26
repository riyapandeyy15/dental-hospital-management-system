const express = require('express');

const doctorSelfController = require('./doctorSelf.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

const router = express.Router();

// A doctor's own profile - distinct from /api/v1/doctors (admin-only doctor
// management). requireRole('DOCTOR') here means an admin cannot use this
// route, and a doctor can never reach the admin one (see doctor.routes.js).
router.use(requireAuth, requireRole('DOCTOR'));

router.get('/', doctorSelfController.getMyProfile);
router.put('/', doctorSelfController.updateMyProfileValidators, doctorSelfController.updateMyProfile);
router.put('/availability', doctorSelfController.updateMyAvailability);

module.exports = router;
