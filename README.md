# Lead Platform — Lead Management Platform

🚀 **Frontend Live App**: [https://lead-platform-sandy.vercel.app](https://lead-platform-sandy.vercel.app)
⚡ **Backend Live API**: [https://lead-platform-6au2.onrender.com/api](https://lead-platform-6au2.onrender.com/api)

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Folder Structure](#folder-structure)
- [API Documentation](#api-documentation)
- [Demo Credentials](#demo-credentials)
- [Role Permissions](#role-permissions)
- [Testing](#testing)
- [Deployment Guide](#deployment-guide)
- [Security Features](#security-features)

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  React 19   │────▶│  Express API │────▶│  MongoDB Atlas │
│  (Vite)     │     │  (Node.js)   │     │  (Mongoose)    │
│  Tailwind   │     │  JWT Auth    │     │                │
│  Zustand    │     │  Zod Valid.  │     │                │
│  Axios      │     │  Layered     │     │                │
└─────────────┘     └──────────────┘     └────────────────┘
     Vercel               Render
```

### Backend Layering
```
Routes → Controllers → Services → Repositories → Mongoose Models
  ↑                        ↑
Auth middleware       AppError/response helpers
```

- **Controllers** handle HTTP (req/res), never touch the database
- **Services** hold business logic and orchestrate repositories
- **Repositories** encapsulate all Mongoose queries
- **Validators** (Zod) run before controllers on every mutating route
- **Error middleware** catches all errors and returns consistent JSON format

---

## Quick Start

### Prerequisites
- Node.js LTS (v18 or v20)
- MongoDB Atlas cluster (free tier works)
- Git

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run seed    # Creates demo users and 15 sample leads
npm run dev     # Starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # Starts on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `PORT` | No | Server port (default: `5000`) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Random string, min 32 chars |
| `JWT_EXPIRES_IN` | No | Token TTL (default: `60m`) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: `http://localhost:5173`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Backend API URL (default: `/api` via Vite proxy) |

---

## Folder Structure

```
LeadPlatform/
├── backend/
│   ├── config/          # DB connection + app config
│   ├── controllers/     # HTTP handlers (authController, leadController, etc.)
│   ├── services/        # Business logic
│   ├── repositories/    # Mongoose query encapsulation
│   ├── models/          # Mongoose schemas (User, Lead, Note, Activity)
│   ├── middlewares/     # Auth guard, role guard, error handler
│   ├── validators/      # Zod schemas
│   ├── utils/           # AppError, response helpers
│   ├── routes/          # Express routers
│   ├── tests/           # Jest + Supertest (auth, authz, leads)
│   ├── seed.js          # Demo data seeder
│   └── server.js        # Express entry point
│
├── frontend/
│   └── src/
│       ├── components/  # Reusable UI (Skeleton, StatusBadge, etc.)
│       ├── pages/       # Landing, Login, Dashboard, Leads, LeadDetail, LeadCapture
│       ├── layouts/     # PublicLayout, AuthLayout, DashboardLayout
│       ├── hooks/       # useDebounce
│       ├── store/       # Zustand authStore
│       ├── services/    # Axios API layer
│       ├── contexts/    # AuthContext
│       └── tests/       # Vitest + React Testing Library
│
├── render.yaml          # Render one-click deploy config
└── README.md
```

---

## API Documentation

### Base URL

- **Local**: `http://localhost:5000/api`
- **Production**: `https://lead-platform-6au2.onrender.com/api`

### Response Envelope

Every response follows this consistent shape:

```json
// Success
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description"
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | OK — request succeeded |
| `201` | Created — resource created |
| `400` | Bad Request — validation failed |
| `401` | Unauthorized — missing or invalid JWT |
| `403` | Forbidden — authenticated but insufficient role/ownership |
| `404` | Not Found — resource doesn't exist |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error |

---

### Endpoints

#### Auth

| Method | Route | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Public | — | Log in, returns JWT |
| `POST` | `/api/auth/register` | Auth | Admin | Create a new user (admin only) |
| `GET` | `/api/auth/me` | Auth | Any | Get current user profile |

#### Leads

| Method | Route | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/leads` | Auth | Any | List leads (paginated, filtered) |
| `POST` | `/api/leads` | Auth | Any | Create a new lead |
| `GET` | `/api/leads/dashboard` | Auth | Any | Dashboard stats |
| `GET` | `/api/leads/:id` | Auth | Any | Lead detail + notes |
| `PUT` | `/api/leads/:id` | Auth | Any | Update lead |
| `DELETE` | `/api/leads/:id` | Auth | Admin | Delete lead |

#### Notes & Activity

| Method | Route | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/notes` | Auth | Any | Add a timestamped note to a lead |
| `GET` | `/api/activity` | Auth | Any | Recent activity feed |

#### Public

| Method | Route | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/public/capture` | Public | — | Public lead capture form submission |

#### Users (Admin)

| Method | Route | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/users` | Auth | Admin | List all users |

---

### Query Parameters — `GET /api/leads`

| Param | Type | Default | Description |
|---|---|---|---|
| `search` | `string` | — | Search name, email, or company (regex) |
| `status` | `string` | — | Filter by status (New, Contacted, Qualified, Proposal Sent, Won, Lost) |
| `assignedTo` | `string` | — | Filter by assignee user ID |
| `startDate` | `string` | — | Filter by `createdAt >=` (ISO 8601) |
| `endDate` | `string` | — | Filter by `createdAt <=` (ISO 8601) |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `10` | Results per page (max 100) |
| `sortBy` | `string` | `createdAt` | Field to sort by |
| `sortOrder` | `asc`/`desc` | `desc` | Sort direction |

---

### Request/Response Examples

#### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@crm.com",
  "password": "password123"
}
```

```json
// 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f...",
      "name": "Admin User",
      "email": "admin@crm.com",
      "role": "admin"
    }
  }
}
```

```json
// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials"
  }
}
```

---

#### Create Lead

```
POST /api/leads
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1-555-1234",
  "company": "Acme Corp",
  "message": "Interested in your enterprise plan"
}
```

```json
// 201 Created
{
  "success": true,
  "data": {
    "_id": "64f...",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1-555-1234",
    "company": "Acme Corp",
    "status": "New",
    "source": "Manual",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Lead created"
}
```

---

#### List Leads (Paginated)

```
GET /api/leads?search=acme&status=New&page=1&limit=10
Authorization: Bearer <token>
```

```json
// 200 OK
{
  "success": true,
  "data": {
    "leads": [
      {
        "_id": "64f...",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "status": "New",
        "company": "Acme Corp",
        "assignedTo": { "_id": "...", "name": "Alice Member" },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

#### Add Note

```
POST /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "lead": "64f...",
  "content": "Spoke with the client — demo scheduled for next Tuesday."
}
```

```json
// 201 Created
{
  "success": true,
  "data": {
    "_id": "...",
    "lead": "64f...",
    "author": { "_id": "...", "name": "Alice Member" },
    "content": "Spoke with the client — demo scheduled for next Tuesday.",
    "createdAt": "2024-01-16T09:00:00.000Z"
  }
}
```

---

#### Public Lead Capture

```
POST /api/public/capture
Content-Type: application/json

{
  "name": "Prospective Client",
  "email": "prospect@company.com",
  "phone": "+1-800-555-0000",
  "company": "Big Corp",
  "message": "Looking for a CRM solution for 50 people"
}
```

```json
// 201 Created
{
  "success": true,
  "data": { "_id": "...", "name": "Prospective Client", "status": "New", "source": "Public Form" },
  "message": "Thank you! We'll be in touch."
}
```

---

## Demo Credentials

Run `npm run seed` inside `backend/` to populate the database.

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@crm.com` | `password123` |
| **Member** | `alice@crm.com` | `password123` |
| **Member** | `bob@crm.com` | `password123` |

---

## Role Permissions

Backend is the source of truth — middleware enforces all rules server-side. The frontend conditionally renders UI for UX only, never as a security measure.

| Action | Admin | Member |
|---|---|---|
| Register new users | ✅ | ❌ |
| View **all** leads | ✅ | ❌ (assigned leads only) |
| Assign leads to users | ✅ | ❌ |
| Update lead status/fields | ✅ | ✅ (assigned leads only) |
| Delete leads | ✅ | ❌ |
| Add notes | ✅ | ✅ |
| View activity log | ✅ | ✅ (own-lead activity only) |
| List all users | ✅ | ❌ |

---

## Testing

### Backend Tests

```bash
cd backend
npm test
```

**Test suites:**

| File | Coverage |
|---|---|
| `auth.test.js` | Login success/failure, missing fields, admin-only registration |
| `authz.test.js` | Admin can delete, member blocked from delete, member updates assigned lead, member blocked from unassigned lead, member blocked from registering users |
| `leads.test.js` | Create lead, validation rejection, paginated listing, member scoping, delete permissions, member status update |

### Frontend Tests

```bash
cd frontend
npm test
```

---

## Deployment Guide

### Backend → Render (Free Tier)

1. Push this repo to GitHub
2. [Render Dashboard](https://dashboard.render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Set **Root Directory**: `backend`
5. **Build command**: `npm install`
6. **Start command**: `node server.js`
7. Add environment variables (see table above)
8. Click **Deploy**

Or use the included `render.yaml` for one-click deploy.

### Frontend → Vercel (Free Tier)

1. [Vercel](https://vercel.com) → **Import repository**
2. **Root directory**: `frontend`
3. **Framework preset**: Vite
4. Add environment variable: `VITE_API_URL` = `https://<your-render-app>.onrender.com/api`
5. Click **Deploy**

---

## Security Features

| Feature | Implementation |
|---|---|
| Security headers | `helmet` |
| CORS | Whitelist-only (`CLIENT_URL`) |
| Rate limiting | 100 req/15min general, 20 req/min on `/api/auth` |
| Input validation | `zod` on every mutating route |
| NoSQL injection prevention | `express-mongo-sanitize` |
| Password hashing | `bcrypt` with cost factor 12 |
| JWT auth | Signed tokens with configurable expiry |
| No secrets in code | All config via `.env`, never hardcoded |

---

## Known Limitations (MVP)

### ✅ Completed
- JWT auth (access tokens)
- RBAC: admin / member roles
- Lead CRUD with search, filter, sort, pagination
- Status pipeline (New → Contacted → Qualified → Proposal Sent → Won/Lost)
- Notes (append-only with timestamps)
- Activity log (auto-recorded on create/update/assign/delete)
- Dashboard with status summary cards + recent activity feed
- Public lead capture form
- Responsive design (Tailwind CSS)
- Loading skeletons, empty states, error states with retry
- Toast notifications for all mutations
- Seed script with demo data
- Core tests (backend)
- Full API documentation

### 🔜 Stretch Goals
- Refresh tokens (7-day rotating)
- CI/CD via GitHub Actions
- Charts (leads by status, leads over time)
- Dark mode
- Bulk lead import/export (CSV)
- Email notifications

---

Built for [Digital Heroes Full Stack Engineering Task](https://digitalheroesco.com)
