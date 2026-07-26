const Lead = require('../models/Lead');

const findById = (id) => Lead.findById(id).populate('assignedTo', 'name email').populate('createdBy', 'name email');
const create = (data) => Lead.create(data);
const findAndUpdate = (id, data) => Lead.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  .populate('assignedTo', 'name email').populate('createdBy', 'name email');
const findAndDelete = (id) => Lead.findByIdAndDelete(id);

const findAll = (query = {}, options = {}) => {
  const { sort = { createdAt: -1 }, page = 1, limit = 10 } = options;
  return Lead.find(query)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

const countDocuments = (query = {}) => Lead.countDocuments(query);

const countByStatus = () =>
  Lead.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

const totalCount = () => Lead.countDocuments({});

module.exports = { findById, create, findAndUpdate, findAndDelete, findAll, countDocuments, countByStatus, totalCount };
