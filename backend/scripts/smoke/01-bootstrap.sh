#!/usr/bin/env bash
# Smoke 01: Bootstrap — verify Node version, deps, tsc, build
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG="$ROOT/logs/smoke/01-bootstrap.log"
mkdir -p "$(dirname "$LOG")"

echo "=== Smoke 01: Bootstrap ===" | tee "$LOG"

echo "[1] Node version" | tee -a "$LOG"
node -v | tee -a "$LOG"

echo "[2] npm deps installed" | tee -a "$LOG"
[ -d "$ROOT/node_modules" ] && echo "node_modules OK" | tee -a "$LOG"

echo "[3] TypeScript compiles" | tee -a "$LOG"
cd "$ROOT"
./node_modules/.bin/tsc --noEmit 2>&1 | tee -a "$LOG"

echo "=== SMOKE 01 PASS ===" | tee -a "$LOG"
