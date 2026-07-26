# Refactor Example: Lead Creation Endpoint

**Author:** Principal Software Engineer  
**Date:** July 2025

This document demonstrates a complete refactor of a single production endpoint — `POST /leads` — from a typical legacy implementation to a production-grade layered architecture. Every line of the refactored code is explained.

---

## Part 1 — The Inherited Code (Intentionally Bad)

This is a realistic representation of code found in early-stage production systems. It works, but it is not survivable at scale.

```javascript
// ❌ BAD: routes/leads.js
// A single file doing the work of 6 separate concerns.

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ❌ PROBLEM 1: DB model defined inside route file — tightly coupled
const Lead = mongoose.model('Lead', new mongoose.Schema({
  nm: String,       // ❌ PROBLEM 2: Cryptic field names
  em: String,
  ph: String,
  co: String,
  st: String,
  dt: Date,
}));

// ❌ PROBLEM 3: JWT secret hardcoded in source
const JWT_SECRET = 'mysecret123';
const jwt = require('jsonwebtoken');

router.post('/leads', async (req, res) => {
  // ❌ PROBLEM 4: Manual token check copy-pasted in every route
  const token = req.headers['authorization'];
  if (!token) { res.send('no token'); return; }  // ❌ Returns 200 with text, not 401 JSON
  let user;
  try { user = jwt.verify(token, JWT_SECRET); }
  catch(e) { res.send('bad token'); return; }     // ❌ Same problem

  // ❌ PROBLEM 5: No input validation whatsoever
  const { nm, em, ph, co } = req.body;

  // ❌ PROBLEM 6: Inline database query inside route handler
  const existing = await Lead.findOne({ em: em });  // ❌ No try/catch — crashes server on DB error
  if (existing) {
    res.send('already exists');  // ❌ Returns 200, not 409
    return;
  }

  // ❌ PROBLEM 7: Duplicated code — exact same block appears in POST /contacts and POST /clients
  const today = new Date();
  const formatted = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');   // ❌ Reinvents Date.toISOString()

  // ❌ PROBLEM 8: Business logic directly in route — role check hard to find, easy to miss
  if (user.role !== 'admin' && user.role !== 'member') {
    res.send('not allowed');
    return;
  }

  // ❌ PROBLEM 9: No async error handling — DB failure = unhandled rejection = server crash
  const lead = new Lead({ nm, em, ph, co, st: 'new', dt: formatted });
  await lead.save();

  // ❌ PROBLEM 10: No activity log — no audit trail
  // ❌ PROBLEM 11: Success response is inconsistent
  res.send({ msg: 'done', id: lead._id });
});

// ❌ PROBLEM 12: Entire identical block copy-pasted below for PUT /leads/:id
router.put('/leads/:id', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) { res.send('no token'); return; }
  let user;
  try { user = jwt.verify(token, JWT_SECRET); }
  catch(e) { res.send('bad token'); return; }
  // ... 50 more lines of duplicated logic
});

module.exports = router;
```

### What's Wrong — Issue Summary

| # | Issue | Consequence |
|---|---|---|
| 1 | Schema inside route file | Cannot reuse model; changing schema requires touching routes |
| 2 | Cryptic field names (`nm`, `em`) | Future developers cannot read the code |
| 3 | Hardcoded JWT secret | Secret is committed to Git and thus compromised |
| 4 | Auth logic copy-pasted | 20 routes = 20 places to update when auth logic changes |
| 5 | No input validation | NoSQL injection, crash on unexpected types |
| 6 | Inline DB query | Cannot unit test business logic without a live database |
| 7 | Date logic duplicated | Bug in date formatting must be fixed in 3 places |
| 8 | Role check in route | Authorization logic is invisible unless you read every file |
| 9 | No try/catch on DB | One DB timeout crashes the Node process |
| 10 | No audit trail | Cannot investigate "who changed this lead and when" |
| 11 | Inconsistent response | Clients cannot reliably parse `{ msg: 'done' }` vs `{ data: {} }` |
| 12 | PUT handler duplicated | Every future change must be applied twice |

---

## Part 2 — The Refactored Architecture

The refactor introduces six separate files, each with exactly one responsibility.

```
src/
  models/
    Lead.js           ← Schema definition only
  validators/
    lead.validator.js ← Input shape validation
  repositories/
    lead.repository.js← All Mongoose queries
  services/
    lead.service.js   ← Business logic
  controllers/
    lead.controller.js← HTTP parsing + response
  middlewares/
    authenticate.js   ← Token verification
    requireRole.js    ← Role enforcement
  utils/
    AppError.js       ← Structured error class
    catchAsync.js     ← Async wrapper
    response.js       ← Response formatter
  routes/
    lead.routes.js    ← Route definitions only
```

---

### File 1: `models/Lead.js` — Schema Definition

```javascript
// ✅ GOOD: models/Lead.js
// Only concern: define the data shape and indexes.

const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true, maxlength: 200 },
    email:      { type: String, required: true, lowercase: true, trim: true },
    phone:      { type: String, required: true, trim: true },
    company:    { type: String, trim: true, default: '' },
    message:    { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'],
      default: 'New',
    },
    source:     { type: String, default: 'Manual' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }  // ✅ Automatic createdAt and updatedAt fields
);

// ✅ Indexes for the query patterns we know will be frequent
leadSchema.index({ status: 1, assignedTo: 1 });
leadSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Lead', leadSchema);
```

**Why this is better:** The model file is a single source of truth for the data shape. `timestamps: true` replaces the hand-rolled date formatting. Readable field names (`name`, not `nm`). Indexes are defined next to the schema — future engineers immediately see what queries are optimized.

---

### File 2: `validators/lead.validator.js` — Input Validation

```javascript
// ✅ GOOD: validators/lead.validator.js
// Only concern: validate the shape of incoming data before it touches business logic.

const { z } = require('zod');

// ✅ Schemas are exported and can be reused in tests
const createLeadSchema = z.object({
  name:    z.string().min(1, 'Name is required').max(200),
  email:   z.string().email('Must be a valid email address'),
  phone:   z.string().min(6).max(20),
  company: z.string().max(200).optional().default(''),
  message: z.string().max(2000).optional().default(''),
  source:  z.string().max(100).optional(),
});

const updateLeadSchema = z.object({
  name:       z.string().min(1).max(200).optional(),
  email:      z.string().email().optional(),
  phone:      z.string().min(6).max(20).optional(),
  company:    z.string().max(200).optional(),
  status:     z.enum(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']).optional(),
  assignedTo: z.string().nullable().optional(),
});

// ✅ Reusable validation middleware factory
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: messages.join(', ') },
    });
  }
  req.validatedBody = result.data;  // ✅ Downstream code uses validated data only
  next();
};

module.exports = { createLeadSchema, updateLeadSchema, validate };
```

**Why this is better:** Validation is a pure function — no database, no HTTP. It can be tested with `schema.safeParse(data)` in milliseconds without any server setup. Zod's `.safeParse()` never throws. Controllers never receive unvalidated data because `req.validatedBody` only exists after schema passes.

---

### File 3: `repositories/lead.repository.js` — Data Access

```javascript
// ✅ GOOD: repositories/lead.repository.js
// Only concern: translate business intent into Mongoose queries.
// No business logic here — just data access.

const Lead = require('../models/Lead');

const create = (data) => Lead.create(data);

const findById = (id) =>
  Lead.findById(id)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email');

const findAll = (filter, { page = 1, limit = 10, sort = { createdAt: -1 } } = {}) =>
  Lead.find(filter)
    .populate('assignedTo', 'name email role')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

const countDocuments = (filter) => Lead.countDocuments(filter);

const findAndUpdate = (id, data) =>
  Lead.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
    .populate('assignedTo', 'name email role');

const findAndDelete = (id) => Lead.findByIdAndDelete(id);

const countByStatus = () =>
  Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

module.exports = { create, findById, findAll, countDocuments, findAndUpdate, findAndDelete, countByStatus };
```

**Why this is better:** Swapping MongoDB for PostgreSQL requires changing only this file. Services and controllers are completely insulated. Each function has a single, predictable return type. Pagination logic (`skip`, `limit`) lives in one place — not copy-pasted across every query.

---

### File 4: `services/lead.service.js` — Business Logic

```javascript
// ✅ GOOD: services/lead.service.js
// Only concern: orchestrate business rules.
// No HTTP here (no req/res). No Mongoose imports.

const leadRepository = require('../repositories/lead.repository');
const activityRepository = require('../repositories/activity.repository');
const AppError = require('../utils/AppError');

const createLead = async (data, userId, userRole) => {
  // ✅ Business rule: members are auto-assigned to leads they create
  const leadData = { ...data, createdBy: userId };
  if (userRole === 'member' && !leadData.assignedTo) {
    leadData.assignedTo = userId;
  }

  const lead = await leadRepository.create(leadData);

  // ✅ Audit trail created atomically with the business action
  await activityRepository.create({
    actor: userId,
    action: 'Lead Created',
    description: `Lead "${lead.name}" created`,
    lead: lead._id,
  });

  return lead;
};

const getLeadById = async (id, requestingUser) => {
  const lead = await leadRepository.findById(id);
  if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');

  // ✅ Data scoping: members only see their own leads
  if (requestingUser.role === 'member') {
    const isAssigned = lead.assignedTo?._id.toString() === requestingUser._id.toString();
    const isCreator  = lead.createdBy?._id.toString() === requestingUser._id.toString();
    if (!isAssigned && !isCreator) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
  }

  return lead;
};

const updateLead = async (id, data, userId, userRole) => {
  const lead = await leadRepository.findById(id);
  if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');

  // ✅ Authorization check is inside the service, not the route
  if (userRole === 'member') {
    const isAssigned = lead.assignedTo?._id.toString() === userId.toString();
    const isCreator  = lead.createdBy?._id.toString() === userId.toString();
    if (!isAssigned && !isCreator) throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  const oldStatus = lead.status;
  const updated = await leadRepository.findAndUpdate(id, data);

  // ✅ Audit trail only records meaningful changes
  if (data.status && data.status !== oldStatus) {
    await activityRepository.create({
      actor: userId,
      action: 'Status Changed',
      description: `"${lead.name}" moved from "${oldStatus}" to "${data.status}"`,
      lead: id,
    });
  }

  return updated;
};

const deleteLead = async (id, userRole) => {
  if (userRole !== 'admin') throw new AppError('Only admins can delete leads', 403, 'FORBIDDEN');
  const lead = await leadRepository.findById(id);
  if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');
  await leadRepository.findAndDelete(id);
};

module.exports = { createLead, getLeadById, updateLead, deleteLead };
```

**Why this is better:** This file can be unit tested in complete isolation. No HTTP server required. Mock `leadRepository` and you can test every business rule in milliseconds. The service does not know it's inside an Express app — it could be called from a background job, a CLI script, or a message queue consumer.

---

### File 5: `utils/AppError.js` + `utils/catchAsync.js` + `utils/response.js` — Utilities

```javascript
// ✅ GOOD: utils/AppError.js
// Structured error class. The global error handler checks for this type
// to distinguish operational errors from programming bugs.

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;  // ✅ Distinguishes known errors from unexpected bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

```javascript
// ✅ GOOD: utils/catchAsync.js
// Eliminates try/catch boilerplate from every route handler.
// Any thrown error (including from services) is forwarded to the global error handler.

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
```

```javascript
// ✅ GOOD: utils/response.js
// Enforces consistent response shape across the entire API.
// API consumers can always parse { success, data, message }.

const success = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, message });

module.exports = { success };
```

---

### File 6: `middlewares/authenticate.js` — Token Verification

```javascript
// ✅ GOOD: middlewares/authenticate.js
// Written once, applied to any route that needs it.
// The JWT secret comes from config, never from source.

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const config = require('../config');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    // ✅ Re-fetch user to catch deactivated accounts between token issuance and now
    const user = await User.findById(decoded.id);
    if (!user || !user.active) throw new AppError('Account not found or inactive', 401, 'UNAUTHORIZED');

    req.user = user;
    next();
  } catch (err) {
    next(err);  // ✅ Forwards to global error handler
  }
};

// ✅ GOOD: middlewares/requireRole.js — Pure role enforcement
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
  }
  next();
};

module.exports = { authenticate, requireRole };
```

---

### File 7: `controllers/lead.controller.js` — HTTP Layer

```javascript
// ✅ GOOD: controllers/lead.controller.js
// Only concern: parse HTTP input, call service, format HTTP output.
// No business logic. No database calls.

const leadService = require('../services/lead.service');
const { success } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const lead = await leadService.createLead(req.validatedBody, req.user._id, req.user.role);
  success(res, lead, 'Lead created', 201);
});

const getById = catchAsync(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id, req.user);
  success(res, lead);
});

const update = catchAsync(async (req, res) => {
  const lead = await leadService.updateLead(req.params.id, req.validatedBody, req.user._id, req.user.role);
  success(res, lead, 'Lead updated');
});

const remove = catchAsync(async (req, res) => {
  await leadService.deleteLead(req.params.id, req.user.role);
  success(res, null, 'Lead deleted');
});

module.exports = { create, getById, update, remove };
```

---

### File 8: `routes/lead.routes.js` — Route Definitions

```javascript
// ✅ GOOD: routes/lead.routes.js
// Only concern: map HTTP verbs + paths to middleware chains.
// Reading this file tells you everything about what the API does and who can access it.

const router = require('express').Router();
const ctrl = require('../controllers/lead.controller');
const { authenticate, requireRole } = require('../middlewares/authenticate');
const { validate, createLeadSchema, updateLeadSchema } = require('../validators/lead.validator');

router.get('/',     authenticate,                                   ctrl.list);
router.get('/:id',  authenticate,                                   ctrl.getById);
router.post('/',    authenticate, validate(createLeadSchema),       ctrl.create);
router.put('/:id',  authenticate, validate(updateLeadSchema),       ctrl.update);
router.delete('/:id', authenticate, requireRole('admin'),           ctrl.remove);

module.exports = router;
```

Reading these 5 lines tells a new engineer: who can access each endpoint, what validation applies, and which controller handles it. No reading of 300-line files required.

---

## Part 3 — Comparative Analysis

| Dimension | Before | After |
|---|---|---|
| **Readability** | 300 lines in one file. Auth, DB, business rules, and response formatting interleaved. Cannot understand without reading everything. | Each file is < 60 lines. You can understand the system piece by piece. A new engineer reads the route file and immediately knows the whole endpoint. |
| **Maintainability** | Changing the auth mechanism requires updating 20 route files. | Changing the auth mechanism requires updating one middleware file. |
| **Scalability** | Adding a new endpoint means copy-pasting 80 lines. | Adding a new endpoint means writing a 4-line route, a 5-line controller, and a service method. |
| **Testability** | Testing `createLead` business logic requires an HTTP server and a real database. | Testing `leadService.createLead` requires a mock repository (3 lines). Runs in < 10ms. |
| **Security** | JWT secret in source. NoSQL injection possible. No auth on some routes because copy-paste was forgotten. | Secret in environment. Zod blocks injection at the edge. Auth is middleware — impossible to forget. |
| **Performance** | N+1 query risk. No pagination. All records returned. | Pagination built into repository. `.populate()` is selective. Indexes defined on query patterns. |

---

## Part 4 — Test Example for the Refactored Code

The layered architecture makes this test possible without a running server:

```javascript
// ✅ Unit test for lead.service.js — no HTTP, no real database
const { createLead } = require('../services/lead.service');
const leadRepository = require('../repositories/lead.repository');
const activityRepository = require('../repositories/activity.repository');

jest.mock('../repositories/lead.repository');
jest.mock('../repositories/activity.repository');

describe('leadService.createLead', () => {
  it('auto-assigns member to their own lead', async () => {
    const mockLead = { _id: 'lead123', name: 'Acme Corp' };
    leadRepository.create.mockResolvedValue(mockLead);
    activityRepository.create.mockResolvedValue({});

    await createLead({ name: 'Acme Corp', email: 'a@b.com', phone: '1234' }, 'user456', 'member');

    expect(leadRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ assignedTo: 'user456', createdBy: 'user456' })
    );
  });

  it('throws 403 when member tries to access another member lead', async () => {
    // ... test RBAC rule at the service level, not at the HTTP level
  });
});
```

This test runs in < 50ms and requires no network, no database, and no server startup.

---

*The patterns demonstrated here are applied throughout the Lead Platform CRM codebase. See the `backend/` directory for the live implementation.*
