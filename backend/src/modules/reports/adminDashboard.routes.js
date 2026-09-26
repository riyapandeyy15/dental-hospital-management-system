const express = require('express');

const adminDashboardController = require('./adminDashboard.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', adminDashboardController.getDashboard);

module.exports = router;
