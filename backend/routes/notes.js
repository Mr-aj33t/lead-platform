const router = require('express').Router();
const noteController = require('../controllers/noteController');
const { authenticate } = require('../middlewares/auth');
const { createNoteSchema, validate } = require('../validators/note');

router.post('/', authenticate, validate(createNoteSchema), noteController.create);

module.exports = router;
