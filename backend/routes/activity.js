const router = require('express').Router();
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, activityController.list);

module.exports = router;
