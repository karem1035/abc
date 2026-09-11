# Dashboard — build context: repository root
FROM oven/bun:1 AS build
WORKDIR /repo

COPY package.json bun.lock ./
COPY apps/dashboard/package.json apps/dashboard/
RUN bun install --frozen-lockfile --filter dashboard

COPY apps/dashboard apps/dashboard
WORKDIR /repo/apps/dashboard
RUN bun run build

FROM nginx:alpine
COPY --from=build /repo/apps/dashboard/dist /usr/share/nginx/html
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
