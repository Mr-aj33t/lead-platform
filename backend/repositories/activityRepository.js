const Activity = require('../models/Activity');

const create = (data) => Activity.create(data);
const findRecent = (query = {}, limit = 10) =>
  Activity.find(query).populate('actor', 'name email').populate('lead', 'name').sort({ createdAt: -1 }).limit(limit);

module.exports = { create, findRecent };
