const doctorDashboardService = require('./doctorDashboard.service');

async function getDashboard(req, res, next) {
  try {
    const data = await doctorDashboardService.getDoctorDashboard(req.doctorId);
    res.status(200).json({ status: 'ok', ...data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
