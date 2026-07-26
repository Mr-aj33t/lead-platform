const User = require('../models/User');

const findByEmail = (email) => User.findOne({ email }).select('+password');
const findById = (id) => User.findById(id);
const create = (data) => User.create(data);
const findAll = () => User.find({}).sort({ createdAt: -1 });

module.exports = { findByEmail, findById, create, findAll };
