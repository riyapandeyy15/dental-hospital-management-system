const Patient = require('../models/Patient');
const ApiError = require('../utils/apiError');

// Runs after requireAuth + requireRole('PATIENT'). Resolves the Patient
// profile linked to the authenticated user and attaches its id as
// req.patientId, so every patient-portal route always scopes to "myself"
// rather than trusting any patient id from the request.
async function attachPatientContext(req, res, next) {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      throw new ApiError(404, 'No patient profile is linked to this account.');
    }
    req.patientId = patient._id.toString();
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = attachPatientContext;
