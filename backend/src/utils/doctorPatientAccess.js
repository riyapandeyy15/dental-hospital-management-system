const mongoose = require('mongoose');

const Appointment = require('../models/Appointment');
const ApiError = require('../utils/apiError');

// A doctor may only view a patient's information if they have at least one
// appointment together - the only relationship the current data model
// defines between doctors and patients. Used by every doctor-portal route
// that reaches into a specific patient's records.
async function ensureDoctorHasPatientAccess(doctorId, patientId) {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new ApiError(400, 'Invalid patient ID.');
  }

  const hasRelationship = await Appointment.exists({ doctorId, patientId });
  if (!hasRelationship) {
    throw new ApiError(403, 'You do not have access to this patient.');
  }
}

module.exports = { ensureDoctorHasPatientAccess };
