const { z } = require('zod');

const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(6, 'Phone is required').max(20),
  company: z.string().min(1, 'Company is required').max(200),
  message: z.string().max(2000).optional().default(''),
  source: z.string().max(100).optional(),
});

const updateLeadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6).max(20).optional(),
  company: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']).optional(),
  assignedTo: z.string().nullable().optional(),
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

module.exports = { createLeadSchema, updateLeadSchema, validate };
