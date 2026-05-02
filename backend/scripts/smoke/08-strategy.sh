#!/usr/bin/env bash
# Smoke 08: Strategy generate + WS events + report
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG="$ROOT/logs/smoke/08-strategy.log"
mkdir -p "$(dirname "$LOG")"
echo "=== Smoke 08: Strategy ===" | tee "$LOG"

cd "$ROOT"

# Start Node + mockPython
USE_MOCK_PYTHON=1 "$ROOT/node_modules/.bin/tsx" src/index.ts >> "$LOG" 2>&1 &
NODE_PID=$!
PYTHON_PORT=8001 "$ROOT/node_modules/.bin/tsx" src/mocks/mockPython.ts >> "$LOG" 2>&1 &
MOCK_PID=$!
sleep 3

node --input-type=module << 'NODEEOF' 2>&1 | tee -a "$LOG"
import WebSocket from '/home/azureuser/AgentGoldmanDigger/backend/node_modules/ws/index.js';
const BASE = 'http://localhost:3000';

// Session
const s1 = await fetch(`${BASE}/api/onboarding/session`, {
  method: 'POST', headers: {'Content-Type':'application/json'},
  body: JSON.stringify({userHint:{firstName:'Smoke08'}})
});
const { sessionId } = await s1.json();
await fetch(`${BASE}/api/onboarding/session/${sessionId}`, {
  method: 'PATCH', headers: {'Content-Type':'application/json'},
  body: JSON.stringify({investmentGoal:'Wealth creation', consentGiven:true, currentStep:'review'})
});

// Generate
const s2 = await fetch(`${BASE}/api/strategy/generate`, {
  method: 'POST', headers: {'Content-Type':'application/json'},
  body: JSON.stringify({sessionId})
});
const { jobId } = await s2.json();
console.log('jobId:', jobId);

// WS
let completed = false;
let events = [];
await new Promise((resolve) => {
  const ws = new WebSocket(`ws://localhost:3000/ws/strategy/${jobId}`);
  ws.on('message', (data) => {
    const ev = JSON.parse(data.toString());
    events.push(ev.event_type);
    console.log('EVENT:', ev.event_type);
    if (ev.event_type === 'analysis_completed') { completed = true; ws.close(); resolve(); }
  });
  setTimeout(() => { ws.close(); resolve(); }, 8000);
});

if (!completed) { console.error('FAIL: analysis_completed not received'); process.exit(1); }

// Report
await new Promise(r => setTimeout(r, 500));
const r = await fetch(`${BASE}/api/strategy/report/${jobId}`);
const report = await r.json();
const hasDisclaimer = report.modules?.some(m => m.type === 'important_considerations');
if (!hasDisclaimer) { console.error('FAIL: disclaimer missing'); process.exit(1); }
console.log(`Report: ${report.modules.length} modules, disclaimer: ${hasDisclaimer}`);
console.log('STRATEGY SMOKE PASS');
NODEEOF

kill $NODE_PID $MOCK_PID 2>/dev/null || true
echo "=== SMOKE 08 PASS ===" | tee -a "$LOG"
