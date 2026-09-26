const express = require('express');

const patientController = require('./patient.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const attachDoctorContext = require('../../middleware/doctorContext');

const router = express.Router();

// Doctor-facing patient access only. There is no admin patient-management
// module yet (out of scope for this phase), so this router exists purely
// to let a doctor see the patients they have appointments with.
router.use(requireAuth, requireRole('DOCTOR'), attachDoctorContext);

router.get('/', patientController.list);
router.get('/:id', patientController.getById);

module.exports = router;
