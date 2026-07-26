const activityService = require('../services/activityService');
const { success } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const activities = await activityService.getRecentActivity(req.user, limit);
    return success(res, activities);
  } catch (err) {
    next(err);
  }
};

module.exports = { list };
