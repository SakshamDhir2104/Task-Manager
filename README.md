# Team Task Manager

Full-stack web app for creating projects, assigning tasks, and tracking progress with **Admin** / **Member** role-based access.

## Features

- **Authentication** — Sign up, sign in, JWT sessions
- **Projects & teams** — Create projects, invite members by email, assign Admin/Member roles
- **Tasks** — Create, assign, update status (`TODO` / `IN_PROGRESS` / `DONE`), due dates
- **Dashboard** — Totals by status, overdue tasks, tasks assigned to you
- **REST API** — Express + PostgreSQL (Prisma) with validation (Zod) and relational models

## Tech stack

| Layer    | Stack                                      |
| -------- | ------------------------------------------ |
| Frontend | React 19, Vite, React Router               |
| Backend  | Node.js, Express 5, Prisma, PostgreSQL     |
| Auth     | bcrypt + JWT                               |
| Deploy   | Docker → [Railway](https://railway.app)    |

## Local development

### Prerequisites

- Node.js 20+
- PostgreSQL (local or Docker)

### Setup

```bash
# From repo root
npm install

# Configure database (create server/.env from .env.example)
cp .env.example server/.env
# Edit DATABASE_URL and JWT_SECRET in server/.env

# Apply schema
npm run db:push

# Run API (port 4000) + UI (port 5173)
npm run dev
```

Open http://localhost:5173 — the Vite dev server proxies `/api` to the backend.

### API overview

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard` | Dashboard stats |
| GET/POST | `/api/projects` | List / create projects |
| GET/PATCH/DELETE | `/api/projects/:id` | Project CRUD (admin for mutate) |
| POST/PATCH/DELETE | `/api/projects/:id/members` | Team management (admin) |
| GET/POST | `/api/projects/:id/tasks` | Tasks |
| PATCH/DELETE | `/api/projects/:id/tasks/:taskId` | Update / delete task |

## Deploy on Railway (required)

1. Push this repo to GitHub.
2. In [Railway](https://railway.app), **New Project** → **Deploy from GitHub** → select the repo.
3. Add a **PostgreSQL** plugin to the project; Railway injects `DATABASE_URL` into the app service.
4. On the **web service**, set variables:
   - `JWT_SECRET` — long random string (required)
   - `NODE_ENV` — `production` (optional; set by Docker)
5. Railway builds from `Dockerfile` (API + static UI on one port). `PORT` is set automatically.
6. After deploy, open the generated URL and register a user.

Health check: `GET /api/health`

### Submission checklist

- [ ] Live Railway URL works (signup → create project → add task)
- [ ] PostgreSQL attached and migrations applied on start
- [ ] `JWT_SECRET` configured in Railway
- [ ] Repo link + deployed URL submitted per assignment instructions

## Role-based access

| Action | Admin | Member |
| ------ | ----- | ------ |
| View project & tasks | ✓ | ✓ |
| Create / update tasks | ✓ | ✓ |
| Add/remove members, change roles | ✓ | ✗ |
| Edit/delete project | ✓ | ✗ |

Project creator is **Admin** by default.

## License

MIT
