#!/usr/bin/env bash
# Smoke 07: Mock Python standalone HTTP + WS
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG="$ROOT/logs/smoke/07-mock-python.log"
mkdir -p "$(dirname "$LOG")"
echo "=== Smoke 07: Mock Python ===" | tee "$LOG"

cd "$ROOT"
PYTHON_PORT=8099 "$ROOT/node_modules/.bin/tsx" src/mocks/mockPython.ts >> "$LOG" 2>&1 &
MOCK_PID=$!
sleep 2

# Test HTTP
RESP=$(curl -sf -X POST http://localhost:8099/ai/jobs \
  -H "Content-Type: application/json" -H "x-job-id: smoke-07" \
  -d '{"jobId":"smoke-07","userJson":{"persona":"new_investor"}}')
echo "POST /ai/jobs: $RESP" | tee -a "$LOG"
echo "$RESP" | python3 -c "import json,sys; r=json.load(sys.stdin); assert r['job_id']=='smoke-07', 'job_id wrong'" && echo "HTTP PASS" | tee -a "$LOG"

# Test WS events via inline node script
node --input-type=module << 'NODEEOF' 2>&1 | tee -a "$LOG"
import WebSocket from '/home/azureuser/AgentGoldmanDigger/backend/node_modules/ws/index.js';
const ws = new WebSocket('ws://127.0.0.1:8099/ai/jobs/smoke-07/events');
let count = 0;
let found_started = false, found_canvas = false;
ws.on('message', (data) => {
  const ev = JSON.parse(data.toString());
  console.log('EVENT:', ev.event_type);
  count++;
  if (ev.event_type === 'activity_step_started') found_started = true;
  if (ev.event_type === 'canvas_module_ready') found_canvas = true;
  if (ev.event_type === 'analysis_completed') {
    console.log(`Events: ${count}, started: ${found_started}, canvas: ${found_canvas}`);
    ws.close();
    process.exit(found_started && found_canvas ? 0 : 1);
  }
});
ws.on('error', (e) => { console.error(e.message); process.exit(1); });
setTimeout(() => { console.log(`Timeout. Events: ${count}`); ws.close(); process.exit(count > 5 ? 0 : 1); }, 8000);
NODEEOF

kill $MOCK_PID 2>/dev/null || true
echo "=== SMOKE 07 PASS ===" | tee -a "$LOG"
