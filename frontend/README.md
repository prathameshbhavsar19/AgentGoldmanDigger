# Portfolio GPS — Frontend

React 18 + Vite + TypeScript + Tailwind CSS SPA for the Portfolio GPS application.

## Quick Start (full stack — recommended)

```bash
# From this directory (frontend/)
npm install
npm run dev:full
```

`dev:full` boots three services concurrently:

| Service | Port | Command |
|---|---|---|
| Vite dev server | 8080 | `vite --port 8080` |
| Node.js API + WS | 3000 | `backend: npm run dev:node` |
| Mock Python AI | 8001 | `backend: npm run mock:python` |

Open [http://localhost:8080](http://localhost:8080). All `/api/*` and `/ws/*` traffic is proxied by Vite to the real Node backend at `127.0.0.1:3000`.

> **No `VITE_USE_MOCKS` flag is needed or used.** The app always talks to the real backend. Mock service worker (MSW) files remain in `src/mocks/` for Vitest unit tests only.

## Frontend-only dev (if Node backend is already running separately)

```bash
npm run dev
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite only on :8080 (assumes backend is running) |
| `npm run dev:full` | Start Vite + Node + mockPython concurrently |
| `npm run build` | TypeScript check + Vite production build |
| `npm test` | Run Vitest unit/component tests |
| `npm run coverage` | Tests with coverage report |
| `npm run test:e2e` | Playwright E2E against real stack |
| `npm run test:e2e:headed` | Playwright with visible browser |

## Stack Architecture

```
Browser :8080 (Vite)
  ├── REST /api/*  ──proxy──►  Node :3000
  └── WS /ws/*    ──proxy──►  Node :3000
                                  └── HTTP POST /ai/jobs ──► mockPython :8001
                                  └── WS /ai/jobs/:id/events ◄── mockPython :8001
```

## Key Files

| Path | Role |
|---|---|
| `src/lib/api.ts` | Centralized fetch client + field-name mapper (frontend↔backend) |
| `src/lib/ws.ts` | Resilient WebSocket client with reconnect + lastEventId resume |
| `src/lib/useStrategyStream.ts` | React hook: connects WS for a jobId |
| `src/stores/onboardingStore.ts` | Zustand: persisted wizard state |
| `src/stores/canvasStore.ts` | Zustand: live canvas/streaming state |
| `src/features/onboarding/` | 11-step wizard components |
| `src/features/canvas/` | Canvas streaming + module rendering |
| `src/mocks/` | MSW + mock WS (Vitest only, not loaded at runtime) |

## Field Name Mapping

The frontend store uses concise keys; the backend Zod schema uses descriptive keys. The `toBackendShape()` function in `api.ts` translates automatically:

| Frontend store key | Backend field name |
|---|---|
| `goal` | `investmentGoal` |
| `horizon` | `timeHorizon` |
| `capacity` | `monthlyInvestmentCapacity` |
| `savings` | `emergencySavings` |
| `familiarity` | `investmentFamiliarity` |
| `investmentStatus` | `currentInvestmentStatus` |
| `primaryConcern` | `primaryFinancialConcern` |

## Testing

```bash
# Unit + component (Vitest, no backend needed)
npm test

# E2E (Playwright, requires Node + mockPython running via dev:full)
npm run test:e2e

# Full happy-path integration smoke
bash scripts/smoke/integration.sh
```
