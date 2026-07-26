const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

const register = async (userData) => {
  const existing = await userRepository.findByEmail(userData.email);
  if (existing) throw new AppError('Email already in use', 409, 'DUPLICATE');
  return userRepository.create(userData);
};

const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('Invalid credentials', 401, 'AUTH_ERROR');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid credentials', 401, 'AUTH_ERROR');

  const token = jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

module.exports = { register, login };
