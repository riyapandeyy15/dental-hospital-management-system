const Doctor = require('../models/Doctor');
const ApiError = require('../utils/apiError');

// Runs after requireAuth + requireRole('DOCTOR'). Resolves the Doctor
// profile document linked to the authenticated user and attaches its id as
// req.doctorId, so every doctor-portal route always scopes to "myself"
// rather than trusting any doctor id from the request.
async function attachDoctorContext(req, res, next) {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      throw new ApiError(404, 'No doctor profile is linked to this account.');
    }
    req.doctorId = doctor._id.toString();
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = attachDoctorContext;
