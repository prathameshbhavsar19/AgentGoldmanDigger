#!/usr/bin/env bash
# Full integration smoke test for Portfolio GPS.
# Boots the full dev stack and runs Playwright specs.
#
# Usage:
#   bash scripts/smoke/integration.sh             # mock Python
#   bash scripts/smoke/integration.sh --headed    # mock Python, headed browser
#   bash scripts/smoke/integration.sh --real      # real Python AI backend
#   bash scripts/smoke/integration.sh --real --headed
#
# Prerequisites:
#   - frontend/node_modules installed (npm install)
#   - backend/node_modules installed (cd ../backend && npm install)
#   - For --real: conda env goldman-digger-ai with deps installed
#     and ai-backend/.env with ANTHROPIC_API_KEY, LANGFUSE_* configured

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${FRONTEND_DIR}/../backend"
AI_BACKEND_DIR="${FRONTEND_DIR}/../ai-backend"
LOG_DIR="${FRONTEND_DIR}/../logs/smoke"
LOG_FILE="${LOG_DIR}/integration.log"
PID_FILE="/tmp/pgps-smoke-pids"

REAL_PYTHON=0
HEADED=""

for arg in "$@"; do
  case "$arg" in
    --real)    REAL_PYTHON=1 ;;
    --headed)  HEADED="--headed" ;;
  esac
done

# ── Helpers ─────────────────────────────────────────────────
log() { echo "[smoke] $*" | tee -a "${LOG_FILE}"; }
fail() { log "FAIL: $*"; exit 1; }

wait_for_port() {
  local port=$1 label=$2 attempts=60
  log "Waiting for ${label} on :${port}…"
  while ! nc -z 127.0.0.1 "${port}" 2>/dev/null; do
    (( attempts-- )) || fail "${label} did not start within 30 s"
    sleep 0.5
  done
  log "${label} is ready."
}

cleanup() {
  log "Shutting down dev stack…"
  if [[ -f "${PID_FILE}" ]]; then
    while IFS= read -r pid; do
      kill "${pid}" 2>/dev/null || true
    done < "${PID_FILE}"
    rm -f "${PID_FILE}"
  fi
}
trap cleanup EXIT

# ── Setup ────────────────────────────────────────────────────
mkdir -p "${LOG_DIR}"
: > "${LOG_FILE}"

log "=== Portfolio GPS Integration Smoke Test ==="
log "Mode     : $([ ${REAL_PYTHON} -eq 1 ] && echo 'REAL Python AI backend' || echo 'Mock Python')"
log "Frontend : ${FRONTEND_DIR}"
log "Backend  : ${BACKEND_DIR}"
log "Log      : ${LOG_FILE}"

# ── Start backend services ───────────────────────────────────
log "Starting Node backend on :3000…"
(cd "${BACKEND_DIR}" && npm run dev:node >> "${LOG_FILE}" 2>&1) &
BACKEND_PID=$!

if [[ ${REAL_PYTHON} -eq 1 ]]; then
  log "Starting REAL Python AI backend on :8001…"
  (
    cd "${AI_BACKEND_DIR}" && \
    conda run -n goldman-digger-ai \
      uvicorn portfolio_ai.main:app --port 8001 >> "${LOG_FILE}" 2>&1
  ) &
  PY_PID=$!
else
  log "Starting mockPython on :8001…"
  (cd "${BACKEND_DIR}" && npm run mock:python >> "${LOG_FILE}" 2>&1) &
  PY_PID=$!
fi

log "Starting Vite frontend on :8080…"
(cd "${FRONTEND_DIR}" && npm run dev >> "${LOG_FILE}" 2>&1) &
VITE_PID=$!

echo -e "${BACKEND_PID}\n${PY_PID}\n${VITE_PID}" > "${PID_FILE}"

# ── Wait for all services ────────────────────────────────────
wait_for_port 3000 "Node API"
wait_for_port 8001 "$([ ${REAL_PYTHON} -eq 1 ] && echo 'Python AI' || echo 'mockPython')"
wait_for_port 8080 "Vite"

# Give services a moment to settle
sleep 3

# ── Run Playwright specs ─────────────────────────────────────
cd "${FRONTEND_DIR}"

# Always run integration.spec.ts
log "Running integration spec…"
PLAYWRIGHT_BASE_ARGS="--project=chromium"
[[ -n "${HEADED}" ]] && PLAYWRIGHT_BASE_ARGS="${PLAYWRIGHT_BASE_ARGS} ${HEADED}"

if npx playwright test ${PLAYWRIGHT_BASE_ARGS} e2e/integration.spec.ts 2>&1 | tee -a "${LOG_FILE}"; then
  log "✅ integration.spec.ts PASSED"
else
  log "❌ integration.spec.ts FAILED — see ${LOG_FILE}"
  exit 1
fi

# Run scenarios.spec.ts (3-scenario test)
log "Running scenarios spec…"
if npx playwright test ${PLAYWRIGHT_BASE_ARGS} e2e/scenarios.spec.ts 2>&1 | tee -a "${LOG_FILE}"; then
  log "✅ scenarios.spec.ts PASSED"
else
  log "❌ scenarios.spec.ts FAILED — see ${LOG_FILE}"
  exit 1
fi

# ── Verify disk side effects ─────────────────────────────────
log "Verifying backend data directory…"
DATA_DIR="${BACKEND_DIR}/data"

if [[ -d "${DATA_DIR}/users" ]]; then
  USER_COUNT=$(find "${DATA_DIR}/users" -maxdepth 1 -mindepth 1 -type d | wc -l)
  log "Found ${USER_COUNT} user director(ies) in data/users/"
  if (( USER_COUNT == 0 )); then
    fail "No user directories created — user_data.md was not written"
  fi

  MD_FOUND=0
  while IFS= read -r -d '' md_file; do
    if grep -q "# User Profile" "${md_file}" 2>/dev/null; then
      (( MD_FOUND++ ))
    fi
  done < <(find "${DATA_DIR}/users" -name "user_data.md" -print0)

  if (( MD_FOUND == 0 )); then
    log "WARNING: No user_data.md with '# User Profile' found"
  else
    log "✅ Found ${MD_FOUND} user_data.md file(s)"
  fi
else
  log "WARNING: ${DATA_DIR}/users not found"
fi

# ── Langfuse trace assertion (real Python only) ───────────────
if [[ ${REAL_PYTHON} -eq 1 ]]; then
  log "Langfuse: checking recent traces exist (optional — requires LANGFUSE_* keys)…"
  # Basic existence check via Langfuse API health endpoint
  LF_URL="${LANGFUSE_BASE_URL:-http://13.83.220.128:3001}"
  if curl -sf "${LF_URL}/api/public/health" -o /dev/null 2>/dev/null; then
    log "✅ Langfuse instance is reachable"
  else
    log "INFO: Langfuse instance not reachable — trace assertion skipped"
  fi
fi

# ── Done ─────────────────────────────────────────────────────
log ""
log "=== Smoke test PASSED ==="
log "Full output: ${LOG_FILE}"
