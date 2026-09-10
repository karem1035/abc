# Build with the repository root as context.
FROM node:22-bookworm-slim AS dependencies
COPY --from=oven/bun:1.3.14 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/website/package.json apps/website/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN bun install --frozen-lockfile

FROM dependencies AS build
COPY . .
ARG API_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV API_URL=$API_URL NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN bun run --filter website build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/apps/website/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/website/.next/static ./apps/website/.next/static
COPY --from=build --chown=node:node /app/apps/website/public ./apps/website/public
USER node
EXPOSE 3001
CMD ["node", "apps/website/server.js"]
