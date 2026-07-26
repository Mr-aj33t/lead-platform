# Engineering Standards Handbook

**Author:** Principal Software Engineer  
**Version:** 1.0  
**Last Updated:** July 2025  
**Audience:** All engineers — from IC2 to Staff  
**Enforcement:** These are not suggestions. Deviations require a written ADR (Architecture Decision Record).

---

## Preamble

This handbook exists because verbal conventions do not survive team growth. At 5 engineers, you can align through conversation. At 15, you can align through code review. At 30, you can only align through written, enforced standards.

These standards are designed to be **maximally restrictive in areas that matter** (security, correctness, API contracts) and **minimally prescriptive in areas that do not** (code style, naming preferences).

Every standard includes a **Why** section. Engineers who understand the reason behind a rule follow it better than engineers who are simply told to follow it.

---

## 1. Repository Structure

### 1.1 Monorepo Layout

```
repo-root/
├── backend/                     # Express API
│   ├── src/
│   │   ├── config/              # Environment loading only
│   │   ├── controllers/         # HTTP request/response only
│   │   ├── middlewares/         # Express middleware
│   │   ├── models/              # Mongoose schemas
│   │   ├── repositories/        # All database queries
│   │   ├── routes/              # Route definitions
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Pure utilities (no side effects)
│   │   └── validators/          # Input validation schemas
│   ├── tests/
│   │   ├── integration/         # Supertest API tests
│   │   └── unit/                # Service/utility unit tests
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── components/          # Reusable, dumb components
│   │   ├── contexts/            # React context providers
│   │   ├── hooks/               # Custom hooks
│   │   ├── layouts/             # Page layout wrappers
│   │   ├── pages/               # Route-level components
│   │   ├── services/            # Axios API calls
│   │   └── store/               # Global state (Zustand)
│   ├── vercel.json
│   └── vite.config.js
├── docs/                        # Architecture decision records and standards
├── .github/
│   ├── workflows/               # CI/CD pipelines
│   └── PULL_REQUEST_TEMPLATE.md
├── .gitignore
└── README.md
```

**Why this structure:**  
Each directory name declares its responsibility. A new engineer can find where business logic lives (services), where database queries live (repositories), and where HTTP concerns live (controllers) without asking anyone.

### 1.2 Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files (JS) | `kebab-case` | `lead.service.js` |
| Files (React) | `PascalCase.jsx` | `LeadDetail.jsx` |
| Directories | `camelCase` | `controllers/`, `leadService/` |
| Variables | `camelCase` | `const userId = ...` |
| Constants | `SCREAMING_SNAKE` | `const MAX_PAGE_SIZE = 100` |
| Classes | `PascalCase` | `class AppError extends Error` |
| Functions | `camelCase`, verb-first | `createLead()`, `getLeadById()` |
| Database collections | `PascalCase` (Mongoose convention) | `Lead`, `User`, `Activity` |
| Environment variables | `SCREAMING_SNAKE` | `JWT_SECRET`, `MONGODB_URI` |
| React components | `PascalCase` | `StatusBadge`, `ProtectedRoute` |
| React hooks | `useCamelCase` | `useDebounce`, `useLeads` |
| Test files | Match source file + `.test.js` | `lead.service.test.js` |

---

## 2. SOLID Principles in Practice

### S — Single Responsibility

> A module should have one reason to change.

**Enforced by architecture:**
- Controllers change when HTTP contract changes.
- Services change when business rules change.
- Repositories change when query patterns change.
- Models change when the data shape changes.

**Violation signal:** A file imports from more than two distinct concern areas (e.g., a model file that also imports `jwt`).

### O — Open/Closed

> Open for extension, closed for modification.

Add new lead statuses by extending the `enum` — not by adding `if` statements throughout the codebase. Use middleware composition for cross-cutting concerns (auth, validation, logging) rather than modifying existing handlers.

### L — Liskov Substitution

In a repository pattern: if you replace `MongoLeadRepository` with `PostgresLeadRepository`, all services that depend on it must work without modification. Repository interfaces must be consistent.

### I — Interface Segregation

Do not create a single `authService.js` that handles authentication, authorization, and user management. Split into `authService.js`, `permissionService.js`, and `userService.js`.

### D — Dependency Inversion

Services depend on repository abstractions, not Mongoose directly. This is what makes unit testing possible without a database.

---

## 3. Code Quality Standards

### 3.1 DRY (Don't Repeat Yourself)

| Threshold | Action Required |
|---|---|
| Same logic written twice | Consider extraction |
| Same logic written three times | **Must** extract to a shared utility |
| Same API response shape written manually | **Must** use the `response.js` utility |
| Same validation rule in multiple schemas | **Must** extract to a shared Zod refinement |

**DRY does not mean never repeat strings.** Two independent modules that happen to both use `"Not found"` do not need a shared constant — that would create coupling for no benefit.

### 3.2 KISS (Keep It Simple)

- Prefer `Array.find()` over a custom loop.
- Prefer `async/await` over `.then().catch()` chains.
- Prefer early returns over deeply nested `if/else`.
- Do not use a design pattern because it sounds impressive. Use it when it solves a concrete problem you have right now.

```javascript
// ❌ Over-engineered
const leadFactory = new LeadFactoryBuilder()
  .withStrategy(new DefaultLeadStrategy())
  .build();
const lead = leadFactory.produce(data);

// ✅ Correct
const lead = await Lead.create(data);
```

---

## 4. Authentication Standards

### 4.1 JWT Policy

| Setting | Required Value | Reason |
|---|---|---|
| Algorithm | `HS256` (minimum) | Default; use `RS256` if multi-service |
| `expiresIn` | `60m` maximum | Short expiry limits blast radius of a stolen token |
| Secret length | ≥ 32 bytes (256-bit) | Brute force resistant |
| Secret storage | Environment variable only | Never in source code |
| Token location | `Authorization: Bearer <token>` header | Not in URL params (appear in server logs) |
| Refresh tokens | Store hash in database, not plaintext | Enables revocation |

### 4.2 Password Policy

```javascript
// Minimum implementation
const hash = await bcrypt.hash(password, 12);  // cost factor ≥ 12

// Validation (enforced via Zod)
const passwordSchema = z.string()
  .min(8, 'At least 8 characters')
  .max(128, 'Maximum 128 characters');
  // Do NOT enforce complexity rules — they reduce actual entropy
  // https://pages.nist.gov/800-63-3/sp800-63b.html
```

**Why no complexity rules:** NIST 800-63B (2017) explicitly recommends against character complexity rules. They cause users to use predictable patterns (`Password1!`) and reduce actual entropy. Length is a better security signal.

### 4.3 Rate Limiting on Auth Routes

```javascript
// Required on all authentication routes
rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 5,                       // 5 attempts
  skipSuccessfulRequests: true, // Only count failures
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts' } }
})
```

---

## 5. Authorization Standards

### 5.1 RBAC Matrix

Authorization must be defined in one place. This matrix is the single source of truth:

| Resource | Action | admin | member |
|---|---|---|---|
| Leads | Create | ✅ | ✅ (auto-assigned) |
| Leads | Read (all) | ✅ | ❌ |
| Leads | Read (own/assigned) | ✅ | ✅ |
| Leads | Update (all) | ✅ | ❌ |
| Leads | Update (own/assigned) | ✅ | ✅ |
| Leads | Delete | ✅ | ❌ |
| Users | Create | ✅ | ❌ |
| Users | List | ✅ | ❌ |
| Activity | Read | ✅ | ✅ (own) |

### 5.2 Enforcement Rules

1. **Authorization must be enforced server-side.** Client-side hiding of UI elements is UX, not security.
2. **Authorization must be enforced in the service layer**, not only in route middleware. A service may be called from multiple entry points (HTTP, queue consumer, CLI).
3. **Fail closed:** When in doubt about whether a user has access, deny. Never default to permissive.
4. **Never trust `req.body.role`.** A user's role comes from the database record attached to their JWT, not from what they send in the request body.

---

## 6. API Standards

### 6.1 REST Conventions

| Pattern | Correct | Incorrect |
|---|---|---|
| Resource naming | Plural nouns: `/leads`, `/users` | Verbs: `/getLead`, `/createUser` |
| ID in path | `/leads/:id` | `/leads?id=123` |
| Actions on resources | `POST /leads/:id/notes` | `POST /addNoteToLead` |
| Filtering | Query params: `?status=New&page=1` | Request body on GET |
| Versioning | `/api/v1/leads` | `/api/leads/v1` |

### 6.2 HTTP Status Codes

| Code | Use Case | Never Use For |
|---|---|---|
| `200 OK` | Successful GET, PUT | Errors (never `200 { error: "..." }`) |
| `201 Created` | Successful POST that creates a resource | Returning existing resource |
| `204 No Content` | Successful DELETE | Delete with body |
| `400 Bad Request` | Validation failure, malformed request | Authentication failure |
| `401 Unauthorized` | Missing or invalid token | Permission denied |
| `403 Forbidden` | Valid token, insufficient role | Missing token |
| `404 Not Found` | Resource does not exist | Authentication failure |
| `409 Conflict` | Duplicate resource (email already exists) | General errors |
| `422 Unprocessable Entity` | Semantically invalid (valid JSON, invalid business rule) | |
| `429 Too Many Requests` | Rate limit exceeded | |
| `500 Internal Server Error` | Unexpected server error | Never return this intentionally |

### 6.3 Response Envelope

Every API response **must** use this shape. No exceptions.

```json
// Success
{
  "success": true,
  "data": {},
  "message": "Lead created"
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email must be a valid email address"
  }
}

// Paginated List
{
  "success": true,
  "data": {
    "leads": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 47,
      "pages": 5
    }
  }
}
```

**Why an envelope:** Without a consistent shape, every API consumer writes different parsing logic. `response.success` is a reliable signal that allows clients to handle errors uniformly without inspecting the HTTP status code.

---

## 7. Validation Standards

### 7.1 Where Validation Lives

```
Request → Zod Middleware → Controller → Service → Repository → Database
          ↑ Validate shape ↑            ↑ Validate rules ↑
```

- **Zod (edge):** Shape, type, format (is this a valid email? is the string within length limits?)
- **Service (business):** Rules (does this user have permission? does the email already exist?)
- **Database (integrity):** Constraints (unique indexes, required fields) — last line of defense only

### 7.2 Required Validation Rules

| Concern | Library | Applied At |
|---|---|---|
| Input shape | `zod` | Route middleware (`validate(schema)`) |
| NoSQL injection | `express-mongo-sanitize` | Global middleware |
| Payload size | `express.json({ limit: '10kb' })` | Global middleware |
| HTML sanitization | `DOMPurify` (frontend) | Before rendering user content |

---

## 8. Git Branch Strategy

### 8.1 Branch Naming

```
main                        # Production. Protected. Requires PR + CI.
feature/<ticket-id>-slug    # feature/CRM-42-lead-assignment
fix/<ticket-id>-slug        # fix/CRM-99-duplicate-email-crash
hotfix/<ticket-id>-slug     # hotfix/CRM-103-auth-bypass
chore/<slug>                # chore/update-dependencies
docs/<slug>                 # docs/api-versioning-policy
```

**Rules:**
- No direct pushes to `main`. Ever.
- Branch names are lowercase kebab-case.
- Every branch references a ticket ID where one exists.
- Branches older than 30 days without activity are deleted.

### 8.2 Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

<body — optional, explains WHY not WHAT>

<footer — optional: BREAKING CHANGE: or Fixes #123>
```

| Type | When to Use |
|---|---|
| `feat` | New user-visible feature |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |
| `chore` | Build system, dependency updates |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |

```
# ✅ Good
feat(leads): add date range filter to lead list API

Allows filtering leads by createdAt range using startDate and endDate
query parameters. Uses MongoDB $gte/$lte operators on the createdAt index.

Fixes #CRM-42

# ❌ Bad
fixed stuff
update
WIP
asdf
```

**Why Conventional Commits:** The format is machine-readable. `semantic-release` can automatically generate changelogs and version bumps from commit history. More importantly, a good commit message is a love letter to the engineer who debugs this at 2 AM in six months.

---

## 9. Pull Request Standards

### 9.1 PR Template

```markdown
## What does this PR do?
<!-- One sentence. If you can't explain it in one sentence, the PR is too large. -->

## Why?
<!-- Link to ticket or explain the business/technical need -->
Refs: #CRM-XX

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manually tested in local environment
- [ ] Manually tested in staging environment (required for auth changes)

## Checklist
- [ ] No secrets or credentials in code
- [ ] No `console.log` in production code
- [ ] Error handling added for all new async operations
- [ ] API documentation updated (if API changed)
- [ ] Database indexes added for new query patterns
- [ ] Breaking API changes versioned

## Screenshots / API Response Examples
<!-- Include for any UI or API changes -->
```

### 9.2 Code Review Checklist

**Reviewer must verify:**

```
Security:
  [ ] No new secrets in source code
  [ ] No new SQL/NoSQL injection vectors
  [ ] Authorization checked server-side (not only frontend)
  [ ] Rate limiting on new public endpoints

Correctness:
  [ ] Business logic matches the ticket description
  [ ] Edge cases handled (empty array, null values, concurrent requests)
  [ ] Error cases return appropriate status codes

Quality:
  [ ] No functions longer than 50 lines
  [ ] No files longer than 200 lines (with exceptions for config)
  [ ] No duplicated logic that should be extracted
  [ ] Meaningful variable names (no x, temp, data2)

Tests:
  [ ] New behavior covered by tests
  [ ] Tests assert meaningful behavior, not just "no error thrown"
  [ ] Test names read as sentences: "it should return 403 when member deletes a lead"

Documentation:
  [ ] README updated if setup steps changed
  [ ] API docs updated if endpoint signature changed
```

**PR Size Policy:**

| Size | Lines Changed | SLA |
|---|---|---|
| Small | < 100 | Same day review |
| Medium | 100–400 | 24 hour review |
| Large | 400–800 | 48 hour review + additional reviewer |
| X-Large | > 800 | **Must be split before review** |

---

## 10. Testing Strategy

### 10.1 Test Pyramid

```
          /\
         /  \
        / E2E \          ← Few. Cypress or Playwright. Smoke tests only.
       /--------\
      / Integrat. \      ← Medium. Supertest. Every API endpoint.
     /--------------\
    /   Unit Tests   \   ← Many. Jest. Every service, utility, validator.
   /------------------\
```

### 10.2 Coverage Targets

| Layer | Minimum Coverage | Rationale |
|---|---|---|
| Services (business logic) | 90% | Most critical; pure functions are easy to test |
| Repositories | 80% | Data access patterns matter for correctness |
| Controllers | 70% | Mostly covered via integration tests |
| Utilities | 95% | Pure functions; no excuse for low coverage |
| Overall | 70% | Below this, refactoring is too risky |

Coverage percentage is a trailing indicator, not a goal. **100% coverage with meaningless assertions is worse than 60% with meaningful assertions.**

### 10.3 Test Naming Convention

```javascript
// Format: describe('[unit under test]', () => { it('[behavior under test]') })

describe('leadService.createLead', () => {
  it('auto-assigns member users to the lead they create');
  it('does not auto-assign admin users');
  it('throws 404 when the specified assignee does not exist');
  it('creates an activity log entry on successful creation');
});

describe('POST /api/leads', () => {
  it('returns 201 with lead data on valid request');
  it('returns 400 when email is missing');
  it('returns 401 when no Bearer token is provided');
  it('returns 403 when called by an inactive user');
});
```

---

## 11. CI/CD Pipeline

### 11.1 Pipeline Definition

```yaml
# Every PR and push to main runs:

jobs:
  quality:
    - Lint (ESLint + Prettier check)
    - Type check (if TypeScript)
    - Security audit (npm audit --audit-level=high)
    - Secret scan (trufflehog)
  
  test:
    - Unit tests (Jest)
    - Integration tests (Jest + Supertest, in-memory MongoDB)
    - Frontend tests (Vitest + RTL)
    - Coverage report
  
  build:
    - Backend: node --check server.js
    - Frontend: vite build
  
  deploy: (main branch only, after all above pass)
    - Deploy backend to Render staging
    - Smoke test staging (/health endpoint)
    - Deploy frontend to Vercel
    - Post deployment notification to #deployments Slack channel
```

### 11.2 Deployment Rules

1. **No manual deployments to production.** All production deployments must go through CI.
2. **Staging is always deployed before production.** There is no exception.
3. **Every deployment is tagged.** `git tag v1.4.2` before merging.
4. **Rollback is one command:** `git revert <commit>` + CI auto-deploys.

---

## 12. Secrets Management

### 12.1 Classification

| Category | Examples | Storage |
|---|---|---|
| Database credentials | `MONGODB_URI` | Render env / AWS Secrets Manager |
| JWT secrets | `JWT_SECRET` | Render env / AWS Secrets Manager |
| Third-party API keys | `SENDGRID_API_KEY` | Render env / AWS Secrets Manager |
| Feature flags | `FEATURE_DARK_MODE=true` | `.env.example` (safe to commit) |
| Public config | `VITE_API_URL` | `.env.example` (safe to commit) |

### 12.2 Rules

- `.env` is always in `.gitignore`. No exceptions.
- `.env.example` must be kept updated with every new variable added.
- Secrets are rotated immediately when any engineer with access leaves the team.
- Secrets are rotated on a 90-day schedule regardless.
- CI/CD secrets are stored in GitHub Actions Secrets, not in workflow YAML files.

---

## 13. Logging Standards

### 13.1 Log Levels

| Level | When to Use |
|---|---|
| `error` | Unexpected errors, uncaught exceptions, security events |
| `warn` | Recoverable errors, deprecated usage, rate limit approaching |
| `info` | Request lifecycle events, startup/shutdown, significant state changes |
| `debug` | Detailed request data, query parameters (disabled in production) |

### 13.2 Required Log Fields

Every log line must include:

```json
{
  "timestamp": "2025-07-26T01:00:00.000Z",
  "level": "error",
  "requestId": "a3f9c2e1-...",
  "userId": "64a1bc...",
  "method": "POST",
  "path": "/api/leads",
  "statusCode": 500,
  "durationMs": 142,
  "message": "Database connection timeout"
}
```

**Never log:**
- Passwords (even hashed)
- Full JWT tokens
- Credit card numbers, SSNs, or any PII that is not required for debugging

---

## 14. Error Handling Standards

### 14.1 Error Classification

```javascript
// Operational errors — expected, recoverable
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

// Programming errors — unexpected bugs
// These should bubble up, be logged with full stack, and cause a process restart
// DO NOT catch and swallow programming errors
```

### 14.2 Global Error Handler Requirements

```javascript
app.use((err, req, res, next) => {
  // Log every error with context
  logger.error({ requestId: req.id, err, userId: req.user?.id });

  // Operational errors: safe to send details to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message }
    });
  }

  // Programming errors: never expose internals
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  });
});
```

---

## 15. Definition of Done

A task is **Done** when all of the following are true:

```
Code:
  [x] Feature works as described in the ticket
  [x] No regressions in existing tests
  [x] New tests written for new behavior
  [x] Coverage does not decrease

Quality:
  [x] PR reviewed and approved by at least 1 engineer
  [x] No lint warnings introduced
  [x] No `console.log` statements in production code
  [x] No TODO comments added without a linked ticket

Security:
  [x] No new secrets in source code
  [x] Input validated on all new mutating endpoints
  [x] Authorization enforced server-side

Deployment:
  [x] CI pipeline passes
  [x] Deployed to staging and smoke tested
  [x] Deployed to production
  [x] README updated if setup changed

Documentation:
  [x] API docs updated if endpoint changed
  [x] CHANGELOG updated
  [x] Ticket moved to Done
```

---

## 16. Database Migration Policy

1. **All schema changes must be backward-compatible during deployment.** The new code and old code must be able to run against the same database simultaneously during a rolling deploy.
2. **Migrations are code.** They live in `backend/migrations/` and are version-controlled.
3. **Migrations are reversible.** Every `up()` migration has a `down()` counterpart.
4. **Never rename a field directly.** Add the new field → backfill data → remove reads of old field → remove the old field in a separate deployment.
5. **Never add a `required` constraint to an existing field in one step.** Add as optional → backfill → add constraint.

---

## 17. Performance Standards

| Endpoint Type | P50 Target | P95 Target | P99 Target |
|---|---|---|---|
| Simple GET (single resource) | < 20ms | < 100ms | < 200ms |
| List with pagination | < 50ms | < 200ms | < 500ms |
| Authenticated write | < 100ms | < 300ms | < 800ms |
| Complex aggregation | < 200ms | < 800ms | < 2s |

Any endpoint exceeding P95 targets for 3 consecutive days must be flagged as a performance bug.

---

## 18. Dependency Update Policy

| Type | Frequency | Approval Required |
|---|---|---|
| Patch updates (1.0.x) | Weekly (automated via Dependabot) | None — auto-merge if tests pass |
| Minor updates (1.x.0) | Monthly | Code review |
| Major updates (x.0.0) | Quarterly, planned | Tech Lead approval + migration spike |
| Security updates (any version) | Immediately on CVE disclosure | Expedited review |

`npm audit --audit-level=high` must pass in CI. A failing audit blocks all merges.

---

*This document is a living standard. Proposed changes require an ADR submitted as a pull request to `docs/`. Approved ADRs supersede this document where they conflict.*

---

## 19. Team Adoption Strategy — Getting a Resistant Team on Board

> The best engineering standards in the world are worth nothing if the team routes around them.

This section is as important as any technical standard in this document. Standards fail not because they are wrong, but because they are introduced wrong.

### 19.1 Why Engineers Resist Standards

Understanding resistance is the first step to overcoming it. Engineers resist standards for predictable reasons:

| Resistance Type | Root Cause | Wrong Response | Right Response |
|---|---|---|---|
| **"This slows me down"** | Standards add friction to existing workflows | "It's mandatory, just do it" | Show the time saved in incident recovery |
| **"The old way works fine"** | No visible pain from current approach | Share CVE reports, production incidents | Share concrete examples from *this* codebase |
| **"Who decided this?"** | Lack of ownership and input | Top-down mandate | Include team in writing the standards |
| **"I'll do it later"** | No immediate enforcement | Verbal reminders | Automate enforcement (CI, linters, PR templates) |
| **"This doesn't apply to my code"** | Special-case thinking | Argue the exception | Accept the exception, document it, revisit in 30 days |

### 19.2 The Adoption Playbook

#### Phase 1 — Listen First (Week 1)

Before proposing any standards, hold a **30-minute "pain mapping" session** with the team. Ask:
- "What was the last bug that took you longer than 2 hours to debug?"
- "What code do you dread touching and why?"
- "If you could change one thing about how we work, what would it be?"

This accomplishes two things: you learn the real pain points, and engineers feel heard. They are far more likely to adopt solutions to problems they identified themselves.

#### Phase 2 — Start With Wins, Not Rules (Week 2)

Do not announce a standards document. Instead, **demonstrate value on a real problem**:

1. Pick the most complained-about bug from Phase 1.
2. Fix it using the new patterns (e.g., add tests, extract to a service).
3. Show the team: "Here's the bug we had. Here's why it was hard to find. Here's how the new structure would have caught it in a unit test that runs in 40ms."

Evidence beats authority every time.

#### Phase 3 — Make the Right Thing the Easy Thing (Weeks 3–4)

Resistance collapses when standards are easier to follow than to ignore:

```
❌ Standard: "Always use the response utility"
   (Requires discipline; easy to forget)

✅ Standard: "Always use the response utility"
   + ESLint rule that warns when res.json() is called directly
   + PR template checklist that includes this item
   + Code snippet in VS Code snippets file so it autocompletes
   (Now ignoring it requires active effort)
```

Tooling is the force multiplier. Every standard that can be automated must be automated.

| Standard | Automation |
|---|---|
| No secrets in code | `trufflehog` pre-commit hook + CI step |
| Consistent response shape | ESLint custom rule |
| Tests required | CI blocks merge if coverage drops |
| Conventional commits | `commitlint` + `husky` pre-commit |
| No `console.log` in production | ESLint `no-console` rule |
| Dependency audit | `npm audit` in CI |

#### Phase 4 — Gradual Enforcement (Month 1–2)

Never enforce all standards simultaneously on all code. Use the **Boy Scout Rule**: leave every file you touch better than you found it.

```
Rollout sequence:
  Week 1:  New files must follow standards
  Week 2:  New endpoints must follow standards
  Month 1: Any file touched in a PR must follow standards
  Month 2: Dedicated "standards sprint" for highest-traffic legacy files
  Quarter: Full codebase compliance
```

This prevents the "refactor paralysis" where engineers avoid touching old code because fixing one thing means fixing everything.

#### Phase 5 — Shared Ownership (Ongoing)

Standards that belong to the tech lead die when the tech lead leaves. Standards that belong to the team outlast any individual.

**Practical mechanisms:**

1. **RFC process for standard changes:** Any engineer can propose a change by opening a PR to `docs/EngineeringStandards.md`. Approved after 48-hour review window with no objections.

2. **Rotating "standards shepherd":** Each sprint, a different engineer owns monitoring standards compliance in code review. This distributes the expertise and the responsibility.

3. **Blameless post-mortems:** When a bug reaches production that standards would have prevented, the post-mortem documents: "Would test coverage have caught this? Would validation have prevented this?" This makes standards concrete, not abstract.

4. **Visible metrics:** Post a weekly Slack summary:
   ```
   📊 Engineering Health — Week 29
   Test coverage: 72% (+3%)
   CI pass rate:  94%
   Audit warnings: 0
   PR review time: 18h avg
   ```

When the team can see the metrics improving, they have a reason to care.

### 19.3 Handling Persistent Resistance

Some engineers will resist regardless. The approach depends on the type:

**The "Too Busy" Engineer:**  
They have legitimate workload concerns. Work with them to time-box standard adoption to no more than 20% of their sprint capacity. Never ask an engineer to adopt a standard that doesn't reduce their own future pain.

**The "I Know Better" Engineer:**  
They may be right. Ask them to document their alternative in an ADR. If they can't defend it in writing, the standard stands. If they can, the standard improves.

**The "It Wasn't Like This Before" Engineer:**  
They are mourning a previous way of working. Acknowledge it genuinely: "You're right, the old approach was faster in the short term. Here's the incident log from the last 6 months that this approach would have prevented." Facts, not emotion.

**The Last Resort:**  
If a senior engineer actively undermines team standards after the above, this is a management conversation, not a technical one. Document the impact on team velocity and escalate.

### 19.4 Standards Are Not Static

A standard that cannot be challenged is dogma. Every standard in this document was right when it was written. Some will be wrong in 18 months. The process for revision:

1. Engineer opens PR with proposed change + rationale.
2. 48-hour async review period (comment in PR, not Slack).
3. If no blocking objections: merge and apply from that sprint forward.
4. Quarterly: review all standards touched in the last 3 months. Archive obsolete ones.

The goal is a team where every engineer can say: "I may not have written every standard here, but I understand why each one exists, and I had a path to change the ones I disagreed with."

---

*This document is a living standard. Proposed changes require an ADR submitted as a pull request to `docs/`. Approved ADRs supersede this document where they conflict.*

