#!/usr/bin/env bash
# Smoke 02: Config + health endpoint
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG="$ROOT/logs/smoke/02-config.log"
mkdir -p "$(dirname "$LOG")"
echo "=== Smoke 02: Config + Health ===" | tee "$LOG"

cd "$ROOT"
"$ROOT/node_modules/.bin/tsx" src/index.ts >> "$LOG" 2>&1 &
SERVER_PID=$!
sleep 3

HEALTH=$(curl -sf http://localhost:3000/api/health)
echo "Health: $HEALTH" | tee -a "$LOG"

echo "$HEALTH" | python3 -c "
import json, sys
h = json.load(sys.stdin)
assert h['status'] == 'ok', 'status not ok'
assert h['db'] == 'ok', 'db not ok'
assert 'anthropic_model' in h['ai'], 'anthropic_model missing'
print('Health assertions PASS')
" | tee -a "$LOG"

kill $SERVER_PID 2>/dev/null || true
echo "=== SMOKE 02 PASS ===" | tee -a "$LOG"
