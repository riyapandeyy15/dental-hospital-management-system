const adminDashboardService = require('./adminDashboard.service');

async function getDashboard(req, res, next) {
  try {
    const data = await adminDashboardService.getAdminDashboard();
    res.status(200).json({ status: 'ok', ...data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
