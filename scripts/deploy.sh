#!/usr/bin/env bash
# =============================================================================
# VPS-side deploy script for abdo-erp
# Triggered by .github/workflows/deploy.yml over SSH.
#
# Responsibilities:
#   1. Validate that the new image was loaded by the CI runner.
#   2. Make sure the postgres service is up and healthy.
#   3. Apply pending Prisma migrations against the production database
#      using the new image (`prisma migrate deploy` is idempotent).
#   4. Restart the `app` container with the new image (zero-downtime-ish
#      rolling replace).
#   5. Health-check the new container.
#   6. Prune dangling images to keep disk usage under control.
#
# Required env vars (exported by the GitHub Actions job):
#   NEW_IMAGE   - e.g. abdo-erp:5e563165b99c...
#   NEW_TAG     - the short git SHA
#   PORT        - host port the app is exposed on (default 3000)
#   COMMIT      - short SHA, used as a container label
#   DEPLOYED_AT - ISO-8601 timestamp, used as a container label
# =============================================================================
set -euo pipefail

# ----- Configuration ---------------------------------------------------------
DEPLOY_DIR="${DEPLOY_DIR:-/home/ubuntu/abdo-erp}"
COMPOSE_FILE="${COMPOSE_FILE:-${DEPLOY_DIR}/docker-compose.yml}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"   # 30 * 2s = 60s
HEALTH_SLEEP="${HEALTH_SLEEP:-2}"

cd "${DEPLOY_DIR}"

echo "============================================================"
echo "  abdo-erp deploy"
echo "  IMAGE : ${NEW_IMAGE:-<unset>}"
echo "  TAG   : ${NEW_TAG:-<unset>}"
echo "  PORT  : ${PORT:-3000}"
echo "  COMMIT: ${COMMIT:-unknown}"
echo "  AT    : ${DEPLOYED_AT:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
echo "  DIR   : ${DEPLOY_DIR}"
echo "============================================================"

# ----- Pre-flight checks -----------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed or not in PATH" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: 'docker compose' plugin is not available" >&2
  echo "       Install with: sudo apt install docker-compose-plugin" >&2
  exit 1
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "ERROR: ${COMPOSE_FILE} not found" >&2
  exit 1
fi

if [ ! -f "${DEPLOY_DIR}/.env.production" ]; then
  echo "ERROR: ${DEPLOY_DIR}/.env.production not found" >&2
  echo "       Create it once (see DEPLOY.md §4.2) and keep it 0600." >&2
  exit 1
fi

# Sanity check: the image that the CI just transferred must be present locally.
EXPECTED_IMAGE="${NEW_IMAGE:-abdo-erp:latest}"
if ! docker image inspect "${EXPECTED_IMAGE}" >/dev/null 2>&1; then
  echo "ERROR: image '${EXPECTED_IMAGE}' is not loaded on this host" >&2
  echo "       Check the 'Transfer image' step in the GitHub Actions run." >&2
  exit 1
fi

# Make sure the env file is locked down (don't leak secrets via the FS).
chmod 600 "${DEPLOY_DIR}/.env.production" || true

# Export variables consumed by docker-compose.yml (IMAGE/TAG/PORT/COMMIT/DEPLOYED_AT).
export IMAGE="${EXPECTED_IMAGE}"
export TAG="${NEW_TAG:-latest}"
export PORT="${PORT:-3000}"
export COMMIT="${COMMIT:-unknown}"
export DEPLOYED_AT="${DEPLOYED_AT:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

# ----- Step 1: ensure postgres is up ---------------------------------------
echo "[1/5] Ensuring postgres is up and healthy..."
docker compose -f "${COMPOSE_FILE}" up -d postgres
# Wait for postgres healthcheck to pass (up to ~60s).
for i in $(seq 1 30); do
  PG_STATUS=$(docker inspect --format='{{.State.Health.Status}}' \
    "$(docker compose -f "${COMPOSE_FILE}" ps -q postgres)" 2>/dev/null || echo "starting")
  if [ "${PG_STATUS}" = "healthy" ]; then
    echo "       postgres is healthy."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: postgres did not become healthy in time (last status: ${PG_STATUS})" >&2
    docker compose -f "${COMPOSE_FILE}" logs --tail=50 postgres >&2
    exit 1
  fi
  sleep 2
done

# ----- Step 2: run Prisma migrations ----------------------------------------
echo "[2/5] Applying Prisma migrations against the new image..."
# `docker compose run` starts a one-off container from the new image with the
# service's env_file + environment, but does NOT publish ports. The migration
# is idempotent: re-running it is a no-op when the DB is already up to date.
# We invoke the prisma CLI directly from node_modules/.bin (installed in
# the runner image) instead of `npx prisma` to avoid npx's online
# resolution and any network flakiness.
docker compose -f "${COMPOSE_FILE}" run --rm --no-deps app \
  ./node_modules/.bin/prisma migrate deploy

# ----- Step 3: start (or restart) the app with the new image ----------------
echo "[3/5] Starting app with the new image..."
# --force-recreate ensures we get the freshly-loaded image, not a cached one.
# --no-deps avoids restarting postgres along with the app.
docker compose -f "${COMPOSE_FILE}" up -d --force-recreate --no-deps app

# ----- Step 4: health check --------------------------------------------------
echo "[4/5] Waiting for app to become healthy at ${HEALTH_URL}..."
for i in $(seq 1 "${HEALTH_RETRIES}"); do
  if curl -fsS -o /dev/null --max-time 3 "${HEALTH_URL}"; then
    echo "       app is healthy."
    break
  fi
  if [ "$i" -eq "${HEALTH_RETRIES}" ]; then
    echo "ERROR: app did not become healthy after ${HEALTH_RETRIES} attempts" >&2
    echo "---- Last 80 lines of app logs ----" >&2
    docker compose -f "${COMPOSE_FILE}" logs --tail=80 app >&2
    exit 1
  fi
  sleep "${HEALTH_SLEEP}"
done

# ----- Step 5: prune dangling images ----------------------------------------
echo "[5/5] Pruning dangling images..."
docker image prune -f >/dev/null || true

echo "============================================================"
echo "  Deploy succeeded."
echo "  App running: $(docker compose -f "${COMPOSE_FILE}" ps --status running app --format '{{.Name}}' 2>/dev/null || echo 'n/a')"
echo "============================================================"
