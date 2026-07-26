const router = require('express').Router();
const leadController = require('../controllers/leadController');
const { authenticate, requireRole } = require('../middlewares/auth');
const { createLeadSchema, updateLeadSchema, validate } = require('../validators/lead');

router.get('/dashboard', authenticate, leadController.dashboard);
router.get('/', authenticate, leadController.list);
router.get('/:id', authenticate, leadController.getById);
router.post('/', authenticate, validate(createLeadSchema), leadController.create);
router.put('/:id', authenticate, validate(updateLeadSchema), leadController.update);
router.delete('/:id', authenticate, requireRole('admin'), leadController.remove);

module.exports = router;
