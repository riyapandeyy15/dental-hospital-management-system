const patientDashboardService = require('./patientDashboard.service');

async function getDashboard(req, res, next) {
  try {
    const data = await patientDashboardService.getPatientDashboard(req.patientId);
    res.status(200).json({ status: 'ok', ...data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
