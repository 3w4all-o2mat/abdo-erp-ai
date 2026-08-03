# =============================================================================
# abdo-ai-erp — production image (Next.js standalone + Prisma + PostgreSQL)
#
# Package manager : pnpm 9.15.4 (matches package.json#packageManager)
# Base image      : node:20-alpine (matches prisma linux-musl-openssl-3.0.x)
# =============================================================================

# ---------- base ----------
FROM node:20-alpine AS base
# libc6-compat -> required by the Next.js standalone server;
# openssl       -> required by the Prisma query engine on musl (Alpine).
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---------- deps (own stage so installs are cached across rebuilds) ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
RUN pnpm install --frozen-lockfile

# ---------- builder ----------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy DB URL so `prisma generate` never complains about a missing env var.
# Pages that touch the DB are force-dynamic, so `next build` won't connect.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `pnpm build` = `prisma generate && next build`
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate \
  && pnpm build

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Prisma CLI + schema/migrations, used by `prisma migrate deploy` during deploys.
RUN npm install -g prisma@5.22.0

# Only what's needed to run the standalone server.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]