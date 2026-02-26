const dashboardService = require('../services/dashboardService');

exports.getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};