const express = require('express');

const doctorPublicController = require('./doctorPublic.controller');

const router = express.Router();

// Public - no authentication. Lets a visitor browse doctors and check
// availability before registering or logging in, same as a real hospital
// website. Only doctor.service's public projection (no email/phone/etc)
// ever reaches these handlers.
router.get('/', doctorPublicController.list);
router.get('/:id', doctorPublicController.getById);
router.get('/:id/availability', doctorPublicController.getAvailability);

module.exports = router;
