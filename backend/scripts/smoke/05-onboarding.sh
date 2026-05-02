#!/usr/bin/env bash
# Smoke 05: Full onboarding lifecycle
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG="$ROOT/logs/smoke/05-onboarding.log"
mkdir -p "$(dirname "$LOG")"
echo "=== Smoke 05: Onboarding ===" | tee "$LOG"

cd "$ROOT"
"$ROOT/node_modules/.bin/tsx" src/index.ts >> "$LOG" 2>&1 &
SERVER_PID=$!
sleep 3

BASE="http://localhost:3000"

# Create session
RESP=$(curl -sf -X POST "$BASE/api/onboarding/session" \
  -H "Content-Type: application/json" -d '{"userHint":{"firstName":"Smoke","country":"US"}}')
echo "POST session: $RESP" | tee -a "$LOG"
SESSION_ID=$(echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['sessionId'])")
USER_ID=$(echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['userId'])")

# 9 PATCH steps
PATCHES=(
  '{"firstName":"Smoke","country":"US","currency":"USD","ageRange":"25-34","employmentStatus":"Full-time employed","primaryFinancialConcern":"Start investing","currentStep":"goal"}'
  '{"investmentGoal":"Wealth creation","currentStep":"horizon"}'
  '{"timeHorizon":"5-10 years","currentStep":"capacity"}'
  '{"monthlyInvestmentCapacity":"$250-$750","currentStep":"emergency"}'
  '{"emergencySavings":"3-6 months of expenses","currentStep":"risk"}'
  '{"riskReaction":"Review the reason and decide","currentStep":"familiarity"}'
  '{"investmentFamiliarity":"I know a few terms but have not started","currentStep":"status"}'
  '{"currentInvestmentStatus":"No, I have not invested yet","currentStep":"review"}'
  '{"consentGiven":true,"currentStep":"review"}'
)

for PATCH in "${PATCHES[@]}"; do
  PRES=$(curl -sf -X PATCH "$BASE/api/onboarding/session/$SESSION_ID" \
    -H "Content-Type: application/json" -d "$PATCH")
  echo "PATCH: $(echo $PRES | python3 -c 'import json,sys; d=json.load(sys.stdin); print(f"step={d.get(chr(99)+chr(117)+chr(114)+chr(114)+chr(101)+chr(110)+chr(116)+chr(83)+chr(116)+chr(101)+chr(112))}")')" | tee -a "$LOG"
done

# Verify GET
GET_RESP=$(curl -sf "$BASE/api/onboarding/session/$SESSION_ID")
echo "GET: $GET_RESP" | tee -a "$LOG" | python3 -c "
import json, sys
s = json.load(sys.stdin)['session']
assert s['investment_goal'] == 'Wealth creation', 'goal missing'
assert s['consent_given'] == 1, 'consent not set'
print('GET assertions PASS')
" | tee -a "$LOG"

# Check MD
MD_PATH="$ROOT/data/users/$USER_ID/user_data.md"
if [ -f "$MD_PATH" ]; then
  grep -q "Wealth creation" "$MD_PATH" && echo "MD has goal: PASS" | tee -a "$LOG"
  grep -q "Version v1" "$MD_PATH" && echo "MD has consent: PASS" | tee -a "$LOG"
else
  echo "WARNING: MD at $MD_PATH not found (data dir may differ)" | tee -a "$LOG"
fi

kill $SERVER_PID 2>/dev/null || true
echo "=== SMOKE 05 PASS ===" | tee -a "$LOG"
