const patientService = require('./patient.service');

async function list(req, res, next) {
  try {
    const { search, page, limit } = req.query;
    const result = await patientService.listPatientsForDoctor(req.doctorId, { search, page, limit });
    res.status(200).json({ status: 'ok', ...result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const patient = await patientService.getPatientForDoctor(req.doctorId, req.params.id);
    res.status(200).json({ status: 'ok', patient });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById };
