# abc-website-v2

Monorepo for the ABC website — no Directus. Own Hono backend, dashboard SPA, and a Next.js website.

## Apps

| App         | Stack                                                        | Dev port |
| ----------- | ------------------------------------------------------------ | -------- |
| `backend`   | Bun + Hono + Zod OpenAPI, Drizzle ORM, Postgres 17, JWT auth  | 3000     |
| `dashboard` | Vite + React 19 SPA, Tailwind v4, zustand, react-query       | 5173     |
| `website`   | Next.js (App Router), Tailwind v4                            | 3001     |

## Roles

- `admin` — full access (users, audit logs, everything)
- `call_center` — dashboard access (bookings & co, upcoming modules)
- `marketer` — dashboard access (content & co, upcoming modules)

## Getting started

```bash
bun install

# copy env files
cp apps/backend/.env.example apps/backend/.env
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp apps/website/.env.example apps/website/.env.local

# start postgres (docker) + run migrations + seed users
bun run docker:up
bun run db:migrate
bun run db:seed

# run everything
bun run dev
```

- Backend: http://localhost:3000 — API docs at `/doc` and `/swagger`
- Dashboard: http://localhost:5173
- Website: http://localhost:3001

## Seeded users

| Username      | Role         | Password (default) |
| ------------- | ------------ | ------------------ |
| `admin`       | admin        | `0000`             |
| `call_center` | call_center  | `0000`             |
| `marketer`    | marketer     | `0000`             |

Passwords are set via `SEED_*_PASSWORD` in `apps/backend/.env`.

## API overview

All routes are under `/v1` (OpenAPI docs at `/doc`):

- `GET /v1/health` — health check
- `POST /v1/auth/login` — username + password → JWT access token
- `GET /v1/auth/me` — current user
- `POST /v1/auth/logout` — audited logout (stateless JWT)
- `GET|PUT /v1/profile/me` — own profile
- `GET|POST /v1/users`, `GET|PUT|DELETE /v1/users/:id` — admin-only user management
- `GET /v1/audit-logs` — admin-only, paginated audit trail

Auth mutations (login/logout), user management, and profile changes are recorded in the `audit_logs` table.

## Notes

- This repo is a scaffold: business modules (doctors, departments, blog, bookings, i18n) are added in later steps.
- Database is Postgres 17 via docker-compose; MinIO/S3 storage will be added when media is needed.
