const authService = require('../services/authService');
const { success } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.validatedBody);
    return success(res, user, 'User registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;
    const result = await authService.login(email, password);
    return success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  return success(res, { user: req.user });
};

module.exports = { register, login, getMe };
