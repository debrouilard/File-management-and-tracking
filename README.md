# File Management and Tracking

Secure, full-stack document management and inter-department file tracking: **Express + PostgreSQL (Prisma) + React (Vite)**.

## Features

- **RBAC**: `ADMIN`, `DEPARTMENT_HEAD`, `STAFF` with department-scoped access for non-admins.
- **Files**: Auto-increment numeric ID + department prefix; display format `PREFIX-NUMBER` (e.g. `REG-42`).
- **Lifecycle**: Draft → Sent → Received → Under review → Approved / Rejected → Archived.
- **Uploads**: PDF and JPG/JPEG only, size limits, stored under `server/uploads/` (not publicly served); download and inline preview are authorized per request.
- **Notifications**: In-app (DB) with read/unread; Socket.IO push (`notification` event).
- **Audit**: Append-only `AuditLog` entries for security-relevant actions.
- **Auth**: JWT in `Authorization: Bearer` (no cookie session). CSRF is not used; mutating requests rely on the bearer token, which third-party sites cannot attach cross-origin without XSS.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Quick start

### 1. Database

Create a database and set `DATABASE_URL` (see `server/.env.example`).

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, and CLIENT_ORIGINS (see comments in .env.example)
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

API listens on **http://localhost:4000** (configurable via `PORT`).

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` and `/socket.io` to the API on port 4000.

### 4. Sign in (seed)

- **Email:** `admin@aau.edu`  
- **Password:** `ChangeMe123!`  

Change the password after first use in production.

## Example API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness (no DB check) |
| GET | `/ready` | Readiness (verifies PostgreSQL) |
| POST | `/auth/login` | Login (returns JWT + user) |
| POST | `/auth/change-password` | Change password (clears `mustResetPassword`) |
| GET | `/departments` | List departments |
| POST | `/departments` | Create department (admin) |
| GET | `/users` | List users (admin) |
| POST | `/users` | Create user (admin) |
| POST | `/users/bulk` | CSV bulk import (admin, multipart `file`) |
| GET | `/files` | List + filter/search/sort files |
| POST | `/files` | Create file (multipart: `title`, `description`, `priority`, `document`) |
| GET | `/files/:id` | File detail (receiver may auto-acknowledge sent files) |
| GET | `/files/:id/download` | Download attachment |
| POST | `/files/:id/send` | Send to another department |
| POST | `/files/:id/receive` | Acknowledge receipt |
| PATCH | `/files/:id/status` | Update status (`UNDER_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`, …) |
| GET | `/files/:id/history` | Audit log entries for file |
| GET | `/notifications` | In-app notifications |
| GET | `/audit` | Audit log (admin) |

All authenticated requests send `Authorization: Bearer <token>`. Configure CORS with `CLIENT_ORIGINS` (comma-separated) or rely on dev defaults including `http://localhost:3000` and `http://localhost:5173`. Use `credentials: "include"` on fetch if you add cookie-based features later.

## CSV bulk import format

```csv
name,email,password,role,departmentPrefix
Jane Doe,jane@school.edu,TempPass123!,STAFF,REG
```

## Security notes

- **Secrets**: Use environment variables; never commit real `JWT_SECRET` or DB credentials.
- **Encryption at rest**: Rely on database and disk encryption at the infrastructure layer; swap `server/src/storage/localStorageAdapter.js` for a cloud adapter when needed.
- **Production**: Use HTTPS, set `CLIENT_ORIGINS` to your real web origins (not `*`), short `JWT_EXPIRES_IN`, and consider refresh tokens stored in httpOnly cookies (then reintroduce CSRF for cookie-mutating routes only).

## Project layout

- `server/` — Express API, Prisma schema, uploads, Socket.IO.
- `client/` — React UI (Vite + Tailwind).
