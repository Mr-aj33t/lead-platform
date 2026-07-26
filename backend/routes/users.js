const router = require('express').Router();
const userRepository = require('../repositories/userRepository');
const { authenticate, requireRole } = require('../middlewares/auth');
const { success } = require('../utils/response');

router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const users = await userRepository.findAll();
    return success(res, users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
