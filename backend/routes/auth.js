const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middlewares/auth');
const { registerSchema, loginSchema, validate } = require('../validators/auth');

router.post('/register', authenticate, requireRole('admin'), validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
