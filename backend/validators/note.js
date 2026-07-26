const { z } = require('zod');

const createNoteSchema = z.object({
  lead: z.string().min(1, 'Lead ID is required'),
  content: z.string().min(1, 'Content is required').max(5000),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.errors.map(e => e.message);
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: messages.join(', ') },
    });
  }
  req.validatedBody = result.data;
  next();
};

module.exports = { createNoteSchema, validate };
