# ============================================
# abdo-erp — multi-stage Dockerfile
# ============================================
#  • Stage 1 (dependencies): install node_modules with the appropriate
#    lockfile (pnpm preferred, then npm, then yarn).
#  • Stage 2 (builder):       run `prisma generate` (needed for the
#    @prisma/client to ship the query engine) and `next build` which
#    emits a standalone output in `.next/standalone`.
#  • Stage 3 (runner):       small runtime image that contains only
#    the standalone server, the Prisma engine + CLI, and the
#    prisma/migrations directory. The deploy script runs
#    `prisma migrate deploy` inside the new image.
# ============================================

# IMPORTANT: keep this on the latest Node LTS for security and
# Next.js 15 compatibility.
ARG NODE_VERSION=22-slim

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

# Copy lockfiles + package.json first to leverage Docker layer cache.
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/local/share/.cache/yarn \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund; \
  elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn install --frozen-lockfile; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

# ============================================
# Stage 2: Builder
# ============================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Re-use deps from stage 1
COPY --from=dependencies /app/node_modules ./node_modules

# Copy the rest of the source. .dockerignore keeps this minimal
# (no .next, no node_modules, no .env*, no dev.db, etc.).
COPY . .

# Generate the Prisma query engine into node_modules/.prisma.
# The standalone output relies on it at runtime, and `migrate deploy`
# needs the prisma CLI (which we re-install in the runner stage).
RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable pnpm && pnpm prisma generate; \
    elif [ -f package-lock.json ]; then \
      npx prisma generate; \
    elif [ -f yarn.lock ]; then \
      corepack enable yarn && yarn prisma generate; \
    fi

# Build the Next.js app (output: "standalone" is set in next.config.mjs).
RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable pnpm && pnpm build; \
    elif [ -f package-lock.json ]; then \
      npm run build; \
    elif [ -f yarn.lock ]; then \
      corepack enable yarn && yarn build; \
    fi

# Ensure /app/public exists so the runner stage can COPY it.
# (The .dockerignore excludes public/, but it can still be mounted
# from the host at runtime via the docker-compose volume.)
RUN mkdir -p /app/public

# ============================================
# Stage 3: Runner
# ============================================
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# ----- System deps required by Prisma + Next.js standalone server -----
# - openssl: prisma migrate needs it to talk to postgres
# - dumb-init: proper PID 1 / signal handling
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl dumb-init ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy the Next.js standalone server, static assets, and public/.
# `outputFileTracingIncludes` in next.config.mjs pulls in the
# @prisma/client + .prisma/client at build time, so the runtime
# application has everything it needs.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Copy the Prisma schema + migrations so the deploy script can run
# `npx prisma migrate deploy` inside this image. The actual Prisma
# client query engine is already part of the standalone output
# (via outputFileTracingIncludes).
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Install the prisma CLI in the runner image so `prisma migrate deploy`
# works at container start. pnpm uses a symlink-based node_modules
# layout, so we can't reliably COPY from it across stages. We use npm
# here because the runner image doesn't need a lockfile.
# --ignore-scripts avoids re-running the postinstall (the prisma
# client/engines are already in /app/prisma from the builder stage).
RUN npm install --no-save --no-audit --no-fund --ignore-scripts prisma@5.22.0 \
 && npm cache clean --force

# Re-generate the prisma client in the runner image. This materialises
# the real engine binaries under node_modules/.prisma/client (instead
# of the symlinks left by pnpm in the builder stage), so the runtime
# @prisma/client can dynamically load them.
RUN ./node_modules/.bin/prisma generate \
 && npm cache clean --force

# Ensure .next/ exists and is owned by the non-root user.
RUN mkdir -p .next && chown -R node:node .next

# Switch to non-root user (Node's official image ships a `node` user).
USER node

EXPOSE 3000

# dumb-init gives us proper signal forwarding (SIGTERM → next start stop).
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
