# Portfolio GPS — Backend (Node.js)

Express 5 + TypeScript + SQLite + WebSocket control plane for the Portfolio GPS application.

## Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set your values (secrets stay in .env — never commit it)

# 3. Run in dev mode (Node on :3000 + mock Python on :8001 concurrently)
npm run dev
```

The server starts on `http://localhost:3000`. The mock Python AI service starts on `http://localhost:8001`.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Node + mockPython concurrently (development) |
| `npm run dev:node` | Start Node only |
| `npm run mock:python` | Start mock Python service standalone |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production server |
| `npm run migrate` | Run SQLite migrations |
| `npm run seed` | Seed a demo user for frontend mock dev |
| `npm test` | Run Vitest test suite |
| `npm run coverage` | Run tests with coverage report |

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Required variables:

| Key | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `3000` | HTTP server port |
| `LOG_LEVEL` | `info` | Pino log level |
| `DB_PATH` | `./data/portfolio_gps.db` | SQLite database path |
| `DATA_DIR` | `./data` | Data root directory |
| `USERS_DIR` | `./data/users` | Per-user data directory |
| `PYTHON_HTTP_BASE` | `http://127.0.0.1:8001` | Python AI service HTTP base |
| `PYTHON_WS_BASE` | `ws://127.0.0.1:8001` | Python AI service WS base |
| `USE_MOCK_PYTHON` | `1` | Use mock Python (1=yes, 0=use real Python) |
| `ALLOWED_ORIGINS` | `http://localhost:8080` | CORS allowlist (comma-separated) |
| `UPLOAD_MAX_MB` | `10` | Max upload size in MB |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Model hint echoed in reports |

**`ANTHROPIC_API_KEY` lives only in `ai-backend/.env`. Node never needs it.**

## API Endpoints

### Health
- `GET /api/health` — Server health, DB status, AI model info

### Onboarding
- `POST /api/onboarding/session` — Start a new anonymous onboarding session
- `GET /api/onboarding/session/:sessionId` — Resume session (rehydrate wizard)
- `PATCH /api/onboarding/session/:sessionId` — Update onboarding answers step by step

### Portfolio
- `POST /api/portfolio/upload` — Upload CSV/XLSX portfolio file (multipart, `x-session-id` header)
- `POST /api/portfolio/manual` — Enter holdings manually

### Strategy
- `POST /api/strategy/generate` — Start AI analysis job, returns `{ jobId }`
- `GET /api/strategy/report/:jobId` — Get completed canvas JSON report
- `POST /api/strategy/:jobId/follow-up` — Ask a follow-up question

### WebSocket
- `WS /ws/strategy/:jobId` — Real-time streaming events. Supports `?lastEventId=N` for resume.

## WebSocket Event Types

| Type | Payload |
|---|---|
| `analysis_started` | `{ job_id }` |
| `activity_step_started` | `{ stepId, phase, label }` |
| `activity_thought_delta` | `{ stepId, delta }` |
| `activity_step_completed` | `{ stepId, summary }` |
| `canvas_module_ready` | `{ module: { type, priority, props, moduleId } }` |
| `canvas_module_updating` | `{ moduleId }` |
| `analysis_completed` | `{ job_id }` |
| `analysis_failed` | `{ stepId?, message }` |
| `needs_user_input` | `{ stepId, prompt, options }` |

## Folder Structure

```
backend/
  src/
    config.ts          — typed env loader (Zod)
    server.ts          — Express app + http.Server
    index.ts           — entry point (migrate + start)
    db/                — SQLite schema + typed repos
    services/          — business logic
    routes/            — Express routers
    ws/                — WebSocket gateway
    middleware/        — CORS, error handler, etc.
    utils/             — logger, ids, paths, timing
    mocks/             — mock Python service + timelines
  tests/
    unit/              — Vitest unit tests
    integration/       — Vitest + Supertest integration tests
  scripts/
    migrate.ts         — DB migration runner
    seed-demo.ts       — Demo data seeder
    smoke/             — Live smoke test scripts
  data/                — gitignored runtime data
    portfolio_gps.db
    users/<uid>/user_data.md
  logs/smoke/          — Smoke test logs
```

## Testing

```bash
npm test                # run all tests
npm run coverage        # with coverage report (≥80% lines, ≥75% branches on services/)
```

Tests use an in-memory SQLite database and an inline mock Python service — no real AI backend required.

## Smoke Tests

After running `npm run dev`, in another terminal:

```bash
# Run all smoke tests
bash scripts/smoke/all.sh

# Or individual phases:
bash scripts/smoke/01-bootstrap.sh
bash scripts/smoke/02-config.sh
bash scripts/smoke/07-mock-python.sh
bash scripts/smoke/08-strategy.sh
```

## Architecture

```
Browser :8080  ←→  Node :3000  ←→  Python AI :8001
                        ↓
                    SQLite DB
                        ↓
               data/users/<uid>/
                   user_data.md
```

- **Browser → Node**: REST + WebSocket
- **Node → Python**: HTTP POST `/ai/jobs` (start job with full MD + JSON payload)
- **Python → Node**: Node opens WS client to Python's `/ai/jobs/:id/events` (stream events back)
- **Events → Browser**: Node normalizes and forwards safe events over the frontend WS gateway
