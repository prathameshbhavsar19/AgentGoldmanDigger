#!/usr/bin/env bash
# Run all smoke tests in order. Exit 1 if any fails.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SMOKE_DIR="$ROOT/scripts/smoke"
LOG="$ROOT/logs/smoke/all.log"
mkdir -p "$(dirname "$LOG")"

echo "=== Portfolio GPS Backend — All Smokes ===" | tee "$LOG"
FAILED=0

run_smoke() {
  local script="$1"
  echo "" | tee -a "$LOG"
  echo "--- Running: $script ---" | tee -a "$LOG"
  if bash "$script" 2>&1 | tee -a "$LOG"; then
    echo "✓ $script PASSED" | tee -a "$LOG"
  else
    echo "✗ $script FAILED" | tee -a "$LOG"
    FAILED=$((FAILED + 1))
  fi
}

run_smoke "$SMOKE_DIR/01-bootstrap.sh"
run_smoke "$SMOKE_DIR/02-config.sh"
run_smoke "$SMOKE_DIR/07-mock-python.sh"
run_smoke "$SMOKE_DIR/08-strategy.sh"

echo "" | tee -a "$LOG"
if [ "$FAILED" -eq 0 ]; then
  echo "=== ALL SMOKES PASSED ===" | tee -a "$LOG"
  exit 0
else
  echo "=== $FAILED SMOKE(S) FAILED ===" | tee -a "$LOG"
  exit 1
fi
