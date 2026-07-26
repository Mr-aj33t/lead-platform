const activityRepository = require('../repositories/activityRepository');

const getRecentActivity = async (user, limit = 10) => {
  const query = {};
  if (user.role === 'member') {
    query.actor = user._id;
  }
  return activityRepository.findRecent(query, limit);
};

module.exports = { getRecentActivity };
