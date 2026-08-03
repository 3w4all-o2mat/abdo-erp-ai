#!/usr/bin/env bash
# =============================================================================
# abdo-ai-erp — VPS-side deploy script
#
# Triggered by .github/workflows/deploy.yml over SSH (after `git pull`).
#
# Flow:
#   1. Build the `app` image locally with docker compose (no GHCR involved).
#   2. Make sure `postgres` is up and healthy.
#   3. Apply pending Prisma migrations (`prisma migrate deploy` is idempotent).
#   4. Restart the `app` container with the freshly built image.
#   5. Health-check the app and prune dangling images.
#
# All config comes from `.env.production` (via docker-compose.yml env_file).
#
# Optional env overrides:
#   DEPLOY_DIR      - repo path on the VPS (default /home/ubuntu/abdo-erp-ai)
#   HEALTH_URL      - URL to health-check (default http://127.0.0.1:3000/)
#   HEALTH_RETRIES  - health-check attempts (default 30)
#   HEALTH_SLEEP    - seconds between attempts (default 2)
#   PG_RETRIES      - postgres readiness attempts (default 30)
# =============================================================================
set -euo pipefail

# ----- Configuration ---------------------------------------------------------
DEPLOY_DIR="${DEPLOY_DIR:-/home/ubuntu/abdo-erp-ai}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"   # 30 * 2s = 60s
HEALTH_SLEEP="${HEALTH_SLEEP:-2}"
PG_RETRIES="${PG_RETRIES:-30}"           # 30 * 2s = 60s

cd "${DEPLOY_DIR}"

echo "============================================================"
echo "  abdo-ai-erp deploy"
echo "  DIR   : ${DEPLOY_DIR}"
echo "  DATE  : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================================"

# ----- Pre-flight checks -----------------------------------------------------
command -v docker >/dev/null 2>&1 || { echo "ERROR: docker is not installed" >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "ERROR: 'docker compose' plugin is missing" >&2; exit 1; }
[ -f "${DEPLOY_DIR}/docker-compose.yml" ] || { echo "ERROR: docker-compose.yml not found" >&2; exit 1; }
[ -f "${DEPLOY_DIR}/.env.production" ] || { echo "ERROR: .env.production not found (see DEPLOY.md §4.2)" >&2; exit 1; }

# Lock down the env file so secrets never leak via the filesystem.
chmod 600 "${DEPLOY_DIR}/.env.production" || true

# ----- Step 1: build the app image -------------------------------------------
echo "[1/5] Building app image (docker compose build app)..."
docker compose build app

# ----- Step 2: ensure postgres is up and healthy ------------------------------
echo "[2/5] Ensuring postgres is up and healthy..."
docker compose up -d postgres
for i in $(seq 1 "${PG_RETRIES}"); do
  PG_STATUS=$(docker inspect --format='{{.State.Health.Status}}' \
    "$(docker compose ps -q postgres)" 2>/dev/null || echo "starting")
  if [ "${PG_STATUS}" = "healthy" ]; then
    echo "       postgres is healthy."
    break
  fi
  if [ "$i" -eq "${PG_RETRIES}" ]; then
    echo "ERROR: postgres did not become healthy in time (last: ${PG_STATUS})" >&2
    docker compose logs --tail=50 postgres >&2
    exit 1
  fi
  sleep 2
done

# ----- Step 3: apply Prisma migrations ----------------------------------------
echo "[3/5] Applying Prisma migrations..."
# Runs a throwaway container from the freshly built image. The prisma CLI and
# the prisma/ folder are baked into the image (see Dockerfile). -u root avoids
# any write-permission edge cases for the CLI's cache. Idempotent: re-running
# is a no-op when the DB is already up to date.
docker compose run --rm --no-deps -u root app prisma migrate deploy

# ----- Step 4: restart the app with the new image -----------------------------
echo "[4/5] Restarting app container..."
# --force-recreate ensures we get the freshly built image, not a cached one.
# --no-deps avoids touching postgres.
docker compose up -d --force-recreate --no-deps app

# ----- Step 5: health check + prune -------------------------------------------
echo "[5/5] Waiting for app to become healthy at ${HEALTH_URL}..."
for i in $(seq 1 "${HEALTH_RETRIES}"); do
  if curl -fsS -o /dev/null --max-time 3 "${HEALTH_URL}"; then
    echo "       app is healthy."
    break
  fi
  if [ "$i" -eq "${HEALTH_RETRIES}" ]; then
    echo "ERROR: app did not become healthy after ${HEALTH_RETRIES} attempts" >&2
    echo "---- Last 80 lines of app logs ----" >&2
    docker compose logs --tail=80 app >&2
    exit 1
  fi
  sleep "${HEALTH_SLEEP}"
done

# Prune dangling images to keep disk usage under control.
docker image prune -f >/dev/null || true

echo "============================================================"
echo "  Deploy succeeded."
echo "============================================================"
