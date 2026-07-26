const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const leadService = require('../services/leadService');
const User = require('../models/User');
const { createLeadSchema, validate } = require('../validators/lead');
const { success } = require('../utils/response');

const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post('/leads', publicLimiter, validate(createLeadSchema), async (req, res, next) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    const data = { ...req.validatedBody, source: 'Public Form' };
    const lead = await leadService.createLead(data, admin?._id || req.validatedBody.createdBy);
    success(res, lead, 'Thank you for your interest', 201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
