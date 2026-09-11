# ABC Platform — Docker & Coolify Deployment Plan

Three apps + two backing services:

| App | Build | Runtime | Port |
|---|---|---|---|
| **backend** | `apps/backend/Dockerfile` | Bun + Hono | 3000 |
| **website** | `apps/website/Dockerfile` | Next.js standalone (Bun slim) | 3000 |
| **dashboard** | `apps/dashboard/Dockerfile` | Vite SPA on nginx | 80 |
| postgres | image `postgres:17-alpine` | Coolify managed database | 5432 |
| rustfs (S3) | image `rustfs/rustfs` | Coolify managed / docker compose | 9000 |

All Dockerfiles expect the **repository root as build context** (Coolify default) with the Dockerfile path set to `apps/<app>/Dockerfile`.

---

## 1. Prerequisites

- A Coolify server (v4.x) with Docker.
- A domain, e.g. `abchospital.com`, with DNS records:
  - `abchospital.com` → server (website)
  - `www` → server (website redirect)
  - `dashboard.abchospital.com` → server (dashboard)
  - `api.abchospital.com` → server (backend)
- TLS: enable "Let's Encrypt" on each Coolify app (automatic).

## 2. Provision backing services (once)

### 2.1 PostgreSQL
1. Coolify → **+ New Resource → PostgreSQL 17**.
2. Set the root password; note the internal connection string Coolify generates
   (`postgres://…@coolify-postgres:5432`).
3. Create the database `abc` (Coolify's Postgres UI has an "Init scripts"/database create step —
   or `CREATE DATABASE abc;` via the console tab).
4. Restore/dev-seed later via `bun run db:migrate` + `bun run seed` (see §5).

### 2.2 S3 storage (RustFS)
Option A — deploy `rustfs/rustfs` as a Coolify "docker compose" resource with the same
variables as `docker-compose.yml` (access/secret keys, bucket `abc-public`).
Option B — any S3-compatible provider (Cloudflare R2, Backblaze…). Either way keep these env
values for the backend.

## 3. Create the three apps in Coolify

For each: **+ New Resource → Dockerfile (from Git)** → select the repo → set:

| Setting | backend | website | dashboard |
|---|---|---|---|
| Dockerfile location | `/apps/backend/Dockerfile` | `/apps/website/Dockerfile` | `/apps/dashboard/Dockerfile` |
| Domain | `https://api.…` | `https://…` (+www) | `https://dashboard.…` |
| Port exposed | `3000` | `3000` | `80` |

### 3.1 backend environment
```
DATABASE_URL=postgres://user:pass@<postgres-host>:5432/abc
JWT_SECRET=<64+ random chars>
JWT_EXPIRES_IN=8h
PORT=3000
CORS_ORIGINS=https://abchospital.com,https://dashboard.abchospital.com
RUSTFS_ENDPOINT=http://<rustfs-host>:9000
RUSTFS_ACCESS_KEY=…
RUSTFS_SECRET_KEY=…
RUSTFS_BUCKET=abc-public
RUSTFS_PUBLIC_URL=https://files.abchospital.com   # or the public rustfs endpoint
SEED_ADMIN_PASSWORD=… (optional first-boot seeds)
DEPLOY_HOOK_URL=…  (optional: Coolify webhook to redeploy website)
DEPLOY_HOOK_TOKEN=…
```

### 3.2 website environment (build + runtime)
```
API_URL=http://api:3000/v1            # Coolify internal service name for server-side fetches
NEXT_PUBLIC_API_URL=https://api.abchospital.com/v1   # browser fetches (bookings form)
NEXT_PUBLIC_SITE_URL=https://abchospital.com
```
> Note: `NEXT_PUBLIC_*` is baked at **build** time — after changing it, trigger a rebuild.
> If the internal hostname differs, use whatever Coolify names the backend service
> (`http://<backend-svc>:3000/v1`).

### 3.3 dashboard environment (**build-time only**)
The Vite SPA reads `VITE_API_BASE_URL` at build:
```
VITE_API_BASE_URL=https://api.abchospital.com/v1
VITE_SITE_URL=https://abchospital.com
```
Set these in Coolify **before the first build** (or use a build-arg step); changing them later
requires a rebuild. (Optional hardening: switch `src/lib/auth.ts` to a runtime
`window.__API_URL__` injected by nginx `env.js` — noted as a follow-up.)

## 4. Migrations & seed

After the first backend deploy, run once (Coolify terminal in the backend container, or locally
with a tunnel):
```bash
cd /repo/apps/backend
bun run db:migrate   # applies drizzle migrations
bun run seed         # optional: demo content + admin users
```
Change the seeded passwords immediately (`admin/0000` etc. are dev-only).

## 5. Domain wiring & CORS checklist
- [ ] `CORS_ORIGINS` lists the website **and** dashboard production origins (comma separated).
- [ ] Backend: enable Coolify proxy (strip `/` path) so `/v1/*` reaches Hono.
- [ ] Website build has correct `NEXT_PUBLIC_API_URL` (bookings/news forms post browser→API).
- [ ] Dashboard build has correct `VITE_API_BASE_URL`.
- [ ] RustFS public URL reachable from browsers (doctor/department images).

## 6. One-command redeploy from the dashboard
The backend exposes `POST /deployment` which calls a Coolify **webhook**:
1. In Coolify → website app → **Webhooks** → copy URL.
2. Set `DEPLOY_HOOK_URL` (+ token) on the backend env.
3. Admins then see the "Deploy" card on the dashboard home.

## 7. Local docker verification (before pushing)
```bash
docker build -f apps/backend/Dockerfile  -t abc-backend  .
docker build -f apps/website/Dockerfile  -t abc-website  .
docker build -f apps/dashboard/Dockerfile -t abc-dashboard .
docker run --rm -p 3000:3000 --env-file apps/backend/.env abc-backend
docker run --rm -p 3001:3000 -e NEXT_PUBLIC_API_URL=http://localhost:3000/v1 abc-website
docker run --rm -p 5173:80 abc-dashboard   # needs API base baked at build
```

## 8. Backups & monitoring (recommended)
- Coolify scheduled backup of the Postgres volume (daily, keep 7).
- Volume backups of RustFS bucket.
- Coolify default container health/restart policies are sufficient at this scale.
