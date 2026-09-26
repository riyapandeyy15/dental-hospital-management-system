const express = require('express');

const patientDashboardController = require('./patientDashboard.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const attachPatientContext = require('../../middleware/patientContext');

const router = express.Router();

router.use(requireAuth, requireRole('PATIENT'), attachPatientContext);

router.get('/', patientDashboardController.getDashboard);

module.exports = router;
