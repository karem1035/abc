# Backend — build context: repository root
FROM oven/bun:1 AS run
WORKDIR /repo

COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/
RUN bun install --frozen-lockfile --filter backend

COPY apps/backend/src apps/backend/src
COPY apps/backend/drizzle.config.ts apps/backend/tsconfig.json ./

EXPOSE 3000
WORKDIR /repo/apps/backend
CMD ["bun", "run", "src/index.ts"]
