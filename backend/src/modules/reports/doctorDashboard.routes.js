const express = require('express');

const doctorDashboardController = require('./doctorDashboard.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const attachDoctorContext = require('../../middleware/doctorContext');

const router = express.Router();

router.use(requireAuth, requireRole('DOCTOR'), attachDoctorContext);

router.get('/', doctorDashboardController.getDashboard);

module.exports = router;
