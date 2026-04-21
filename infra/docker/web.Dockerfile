# syntax=docker/dockerfile:1.7-labs
# Multi-stage build for apps/web in Next.js standalone mode.
#
# Stages:
#   1. deps     -> install workspace dependencies via pnpm fetch (layer-cached)
#   2. builder  -> copy sources, build the standalone Next.js output
#   3. runner   -> minimal runtime image with only the standalone server
#
# Result: a ~150-200 MB image that serves the app with `node server.js`.

ARG NODE_VERSION=22.19.0

FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    NEXT_TELEMETRY_DISABLED=1

# --- deps stage: install just dependencies so this layer stays cached ---
FROM base AS deps
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
# Additional package.jsons are added here as they are created in later PRs.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# --- builder stage: compile the app ---
FROM deps AS builder
WORKDIR /repo
COPY . .
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_NAME="Startup Boilerplate"
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
RUN pnpm --filter @startup-boilerplate/web build

# --- runner stage: minimal, non-root, standalone server ---
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]
