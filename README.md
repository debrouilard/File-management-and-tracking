# AAU File Management

School-based file management and tracking for secure inter-department document exchange. Stack: **React (Vite) + Tailwind**, **Node.js + Express**, **PostgreSQL + Prisma**, **JWT + RBAC**, **Socket.IO** notifications.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## 1. Database

Create a database (example name: `aau_file_management`).

## 2. Backend (`server/`)

```bash
cd server
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, CLIENT_ORIGIN, MAX_UPLOAD_MB
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

The API listens on `http://localhost:4000` by default.

### Environment variables (server)

| Variable        | Description                                      |
|----------------|--------------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string                     |
| `JWT_SECRET`   | Long random string for signing tokens (required) |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`)                |
| `PORT`         | HTTP port (default `4000`)                       |
| `CLIENT_ORIGIN`| Allowed CORS origin (e.g. `http://localhost:5173`) |
| `MAX_UPLOAD_MB`| Upload limit (default `10`)                      |

### Seed credentials

After `npm run prisma:seed`:

- **Email:** `admin@aau.edu`
- **Password:** `ChangeMe123!`

Departments **REG**, **FIN**, **ADM** are created if missing.

## 3. Frontend (`client/`)

```bash
cd client
cp .env.example .env   # optional
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies:

- `/api/*` → `http://localhost:4000/*` (REST)
- `/socket.io` → Socket.IO (WebSocket)

Set `VITE_API_URL` only if you build for production without this proxy.

## 4. Production build (client)

```bash
cd client
npm run build
# Serve dist/ behind nginx; proxy /api and /socket.io to the API server.
```

## API overview

Base URL: `http://localhost:4000` (or `/api` prefix when using the Vite proxy).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/users` | Admin | List users |
| POST | `/users` | Admin | Create user (`role`: `ADMIN` \| `STAFF`, `departmentId`) |
| GET | `/departments` | User | List departments |
| POST | `/departments` | Admin | Create department (`name`, `prefix`) |
| GET | `/files` | User | List files (query: `q`, `status`, `departmentId`) |
| GET | `/files/dashboard/summary` | User | Counts: pending, sent, received, rejected |
| POST | `/files` | User | Multipart: `title`, `description`, `document` (PDF/DOCX) |
| GET | `/files/:id` | User | File detail; receiver opening a **SENT** file marks **RECEIVED** |
| GET | `/files/:id/history` | User | Audit timeline |
| GET | `/files/:id/download` | User | Download attachment |
| POST | `/files/:id/send` | User | JSON: `{ "receiverDeptId" }` — pending → sent |
| POST | `/files/:id/reject` | Receiver (or admin) | Sent → rejected |
| DELETE | `/files/:id` | Sender | Delete only **PENDING** drafts |
| GET | `/notifications` | User | List notifications |
| PATCH | `/notifications/:id/read` | User | Mark one read |
| POST | `/notifications/read-all` | User | Mark all read |
| GET | `/search` | User | Same query params as `/files` |

### Example: login

```http
POST /auth/login
Content-Type: application/json

{"email":"admin@aau.edu","password":"ChangeMe123!"}
```

### Example: create file (multipart)

```http
POST /files
Authorization: Bearer <token>
Content-Type: multipart/form-data

title=Memo&description=Quarterly&document=<file>
```

### Example: send to department

```http
POST /files/<fileRecordId>/send
Authorization: Bearer <token>
Content-Type: application/json

{"receiverDeptId":"<department-uuid>"}
```

## Socket.IO

Connect with the same origin as the UI (or `VITE_SOCKET_URL`), path `/socket.io`, and handshake:

```json
{ "auth": { "token": "<JWT>" } }
```

Server joins sockets to `user:<userId>` and `dept:<departmentId>`.

### Events (server → client)

| Event | When |
|-------|------|
| `file_sent` | File moved to **SENT**; payload includes `notificationId`, `fileId`, `message`, `timestamp`, `read` |
| `file_received` | Receiver opened file (**RECEIVED**) |
| `file_rejected` | Receiver rejected (**REJECTED**) |

Each event delivers one persisted notification row for the target user.

## File storage

Uploaded files are stored under:

`server/uploads/<departmentPrefix>/<fileId>/<sanitized-filename>`

The relative path is stored in `FileRecord.filePath`.

## Project layout

- `server/src/controllers`, `routes`, `middleware`, `services`, `sockets`, `utils`
- `client/src/components`, `pages`, `services`, `hooks`, `context`

---

**AAU File Management** — internal academic document routing.
