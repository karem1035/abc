# Website on Coolify behind Cloudflare

Use the repository root as the build context, `apps/website/Dockerfile` as the Dockerfile, and port **3001**. The image runs Next.js standalone as a non-root user.

Set build arguments in Coolify:
- `API_URL`: backend API base reachable from the Docker build, including `/v1`. Do not use localhost: the backend is a separate service. The API must be running while the image builds.
- `NEXT_PUBLIC_API_URL`: public HTTPS backend API base including `/v1`, reachable by visitors for booking, searches, and forms.
- `NEXT_PUBLIC_SITE_URL`: public HTTPS website origin.

Set runtime `API_URL` as well (used during revalidation), and a long random `REVALIDATE_SECRET`. Keep backend CORS_ORIGINS set to the actual website and dashboard origins. Public variables are compiled into the image: rebuild when changing them. Google Fonts must be reachable during the build.

In Coolify, open the website application's Webhooks tab and copy its deploy URL. Create a Coolify API token with deployment permission. Set `DEPLOY_HOOK_URL` and `DEPLOY_HOOK_TOKEN` on the **backend**, then restart it. Admins can use **Deploy website** on the dashboard. The backend sends an authenticated GET with `force=true` to Coolify so Docker cannot reuse stale content from a cached build layer; its token never reaches the browser. A successful button response means the build was requested, not that it has finished. Track completion and failures in Coolify. Requests are throttled for one minute per backend process.

Content pages are statically generated with incremental revalidation (60–300 seconds). Doctor dates and slots are computed/fetched in the browser so cached pages cannot freeze availability. Search/filter query variants are interactive client views over static directory shells.

For immediate content refresh without a Docker rebuild, POST to `/api/revalidate` with `Authorization: Bearer <REVALIDATE_SECRET>`. This invalidates the site cache; pages refresh on their next visit. This protected webhook is available for an edit-event integration; it is not automatically called on every dashboard save. The explicit Coolify deploy button is the supported editorial publish workflow.

Keep Cloudflare's default HTML caching behavior; do not enable Cache Everything for the website. Bypass cache for `/api/*` and the backend API, especially booking availability and authenticated dashboard endpoints. Next.js hashed static assets can retain their immutable cache headers. Otherwise Cloudflare may continue serving stale HTML after a refresh/deployment.

The build fails if it cannot enumerate published content, rather than publishing an empty website. Newly published slugs are also generated on first request, so a full build is not required for new pages to become accessible.

Reference: https://coolify.io/docs/applications/ci-cd/other-providers

Static content fetches retry API rate-limit responses twice, honoring Retry-After (up to 62 seconds per wait). Generation allows 180 seconds per page.
