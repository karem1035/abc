# Website — build context: repository root
FROM oven/bun:1 AS build
WORKDIR /repo

COPY package.json bun.lock ./
COPY apps/website/package.json apps/website/
RUN bun install --frozen-lockfile --filter website

COPY apps/website apps/website
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo/apps/website
RUN bun run build

FROM oven/bun:1-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /repo/apps/website/.next/standalone ./
COPY --from=build /repo/apps/website/.next/static ./apps/website/.next/static
COPY --from=build /repo/apps/website/public ./apps/website/public
EXPOSE 3000
CMD ["bun", "apps/website/server.js"]
