# Portfolio GPS

> **Goldman Sachs Hackathon Project**
>
> An AI-powered portfolio consultation tool for investment beginners — answers "Is my portfolio good?", "Should I change it given current market conditions?", and "What should I build from scratch?" for complete newcomers to investing.

---

## What It Does

Portfolio GPS acts as a financial advisor in your pocket. A user walks through a guided onboarding wizard describing their goals, risk tolerance, time horizon, and existing holdings. The system then runs an AI-powered deep analysis and returns a live-streaming **Canvas** report containing:

- **Goal Summary** — plain-language read-back of their situation
- **Readiness Score** — objective assessment of portfolio health
- **Risk Assessment** — exposure breakdown and flag areas
- **Strategy Options** — curated paths tailored to their goal
- **Important Considerations** — macro factors and external alerts
- **Next Steps** — actionable recommendations

Users can then ask follow-up questions in a conversational interface, and the canvas updates in real time.

---

## Architecture

```
Browser :8080 (React/Vite)
  │
  ├── REST  /api/*  ──proxy──►  Node.js API  :3000
  └── WS    /ws/*   ──proxy──►  Node.js API  :3000
                                     │
                              HTTP POST /ai/jobs
                                     │
                               Python AI  :8001
                               (LangGraph + Claude)
                                     │
                             WS /ai/jobs/:id/events
                                     │
                              streamed back → Node → Browser
                                     │
                              SQLite (portfolio_gps.db)
                              data/users/<uid>/user_data.md
```

| Layer | Tech | Port |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind | 8080 |
| Backend (API & WebSocket) | Express 5 + TypeScript + SQLite + `ws` | 3000 |
| AI Backend | FastAPI + LangGraph + LangChain + Claude | 8001 |
| Reverse proxy (production) | NGINX + Let's Encrypt | 80 / 443 |

---

## Monorepo Structure

```
AgentGoldmanDigger/
├── frontend/          React SPA (Vite + TypeScript + Tailwind)
├── backend/           Node.js API control plane (Express + SQLite + WebSocket)
├── ai-backend/        Python AI service (FastAPI + LangGraph + LangChain)
├── context/           Hackathon brief, UX plan, architecture docs
├── design-system/     Portfolio GPS component & page design specs
├── .gitignore         Root gitignore (Cursor IDE, OS artefacts)
└── README.md          ← you are here
```

---

## Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| Anaconda / conda | any recent |
| NGINX | ≥ 1.18 (production only) |

### 1 — Clone & install

```bash
git clone <repo-url>
cd AgentGoldmanDigger
```

### 2 — Backend (Node.js)

```bash
cd backend
npm install
cp .env.example .env   # fill in required values
npm run migrate        # creates SQLite schema
npm run dev            # Node :3000 + mock Python :8001
```

### 3 — AI Backend (Python)

```bash
cd ai-backend
conda env create -f environment.yml
conda activate goldman-digger-ai
cp .env.example .env   # set ANTHROPIC_API_KEY, TAVILY_API_KEY, etc.
uvicorn portfolio_ai.main:app --reload --port 8001
```

### 4 — Frontend

```bash
cd frontend
npm install
npm run dev:full       # Vite :8080 + spins up Node + mock Python automatically
```

Open [http://localhost:8080](http://localhost:8080).

---

## Service Details

### Frontend (`frontend/`)

React 18 SPA built with Vite. All `/api/*` and `/ws/*` traffic is proxied to the Node backend via the Vite dev config — no manual URL switching.

**Key scripts**

| Command | Description |
|---|---|
| `npm run dev` | Vite only on :8080 (assumes backend already running) |
| `npm run dev:full` | Vite + Node + mock Python concurrently |
| `npm run build` | TypeScript check + Vite production build |
| `npm test` | Vitest unit / component tests |
| `npm run coverage` | Tests with coverage report |
| `npm run test:e2e` | Playwright E2E against real stack |

**Notable dependencies:** React Router v6, Zustand, TanStack Query, Radix UI, Framer Motion, react-hook-form, MSW (test-only).

**Feature folders**

| Path | Purpose |
|---|---|
| `src/features/landing/` | Landing / hero page |
| `src/features/onboarding/` | 11-step guided wizard |
| `src/features/canvas/` | Live-streaming AI Canvas report + follow-up |
| `src/components/ui/` | Shared primitive components (Button, Card, Dialog…) |
| `src/stores/` | Zustand slices (onboarding, canvas) |
| `src/lib/` | API client, WebSocket client, validators, currency |

---

### Backend (`backend/`)

Express 5 + TypeScript control plane. Persists user sessions and analysis results in SQLite. Bridges the browser's WebSocket to the Python AI service.

**Key scripts**

| Command | Description |
|---|---|
| `npm run dev` | Node + mock Python concurrently |
| `npm run dev:node` | Node only |
| `npm run migrate` | Run SQLite migrations |
| `npm run seed` | Seed demo user |
| `npm test` | Vitest suite (unit + integration) |
| `npm run coverage` | ≥ 80% lines / 75% branches on `services/` |

**REST API**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Server + DB health check |
| `POST` | `/api/onboarding/session` | Start a new anonymous session |
| `GET` | `/api/onboarding/session/:id` | Resume / rehydrate session |
| `PATCH` | `/api/onboarding/session/:id` | Save wizard answers step-by-step |
| `POST` | `/api/portfolio/upload` | Upload CSV/XLSX holdings file |
| `POST` | `/api/portfolio/manual` | Enter holdings manually |
| `POST` | `/api/strategy/generate` | Kick off AI analysis → returns `{ jobId }` |
| `GET` | `/api/strategy/report/:jobId` | Fetch completed canvas JSON |
| `POST` | `/api/strategy/:jobId/follow-up` | Ask a follow-up question |
| `WS` | `/ws/strategy/:jobId` | Real-time streaming (supports `?lastEventId=N` resume) |

**WebSocket event types**

| Event | Payload |
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

**Environment variables** — copy `backend/.env.example` to `backend/.env`:

| Key | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DB_PATH` | `./data/portfolio_gps.db` | SQLite path |
| `PYTHON_HTTP_BASE` | `http://127.0.0.1:8001` | Python service base URL |
| `PYTHON_WS_BASE` | `ws://127.0.0.1:8001` | Python service WS base |
| `USE_MOCK_PYTHON` | `1` | `1` = use built-in mock, `0` = real Python |
| `ALLOWED_ORIGINS` | `http://localhost:8080` | CORS allow-list |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Model hint echoed in reports |

> `ANTHROPIC_API_KEY` lives **only** in `ai-backend/.env` — Node never needs it.

---

### AI Backend (`ai-backend/`)

FastAPI service hosting a **LangGraph** agent that performs multi-step portfolio analysis. Streams structured events back to Node over WebSocket.

**Agent pipeline**

1. Parse user profile + holdings
2. Fetch live market data (yfinance)
3. Pull macro indicators (FRED API)
4. Web search for relevant news (Tavily)
5. Run LangChain / LangGraph reasoning graph (Claude via Anthropic)
6. Emit canvas modules one-by-one as structured JSON events
7. Support follow-up Q&A on the completed canvas

**Conda environment**

```bash
conda env create -f ai-backend/environment.yml
conda activate goldman-digger-ai
```

**Key dependencies:** `langchain`, `langgraph`, `langchain-anthropic`, `fastapi`, `uvicorn`, `yfinance`, `fredapi`, `tavily-python`, `langfuse`, `pydantic`.

**Testing**

```bash
cd ai-backend
pytest                    # unit + integration tests
pytest tests/eval/        # LLM eval suite
```

---

## Production Setup (NGINX + HTTPS)

NGINX sits in front of the Vite-built frontend on port 80/443 and proxies to Node on :3000.

```
Internet → NGINX :443 (TLS, Let's Encrypt)
               │
               ├── /          → serve frontend/dist/
               ├── /api/*     → proxy → Node :3000
               └── /ws/*      → proxy (upgrade) → Node :3000
```

TLS certificates are managed by **Certbot** (Let's Encrypt). Renew with:

```bash
sudo certbot renew --nginx
```

---

## Testing

| Layer | Tool | Command |
|---|---|---|
| Frontend unit | Vitest + Testing Library | `cd frontend && npm test` |
| Frontend E2E | Playwright | `cd frontend && npm run test:e2e` |
| Backend unit | Vitest + Supertest | `cd backend && npm test` |
| Backend smoke | bash scripts | `cd backend && bash scripts/smoke/all.sh` |
| AI unit | pytest | `cd ai-backend && pytest tests/unit` |
| AI integration | pytest-asyncio | `cd ai-backend && pytest tests/integration` |
| AI evals | pytest (LLM judge) | `cd ai-backend && pytest tests/eval` |

---

## Observability

- **Langfuse** — LLM traces and prompt evaluation (configured via `LANGFUSE_*` env vars in both `backend/.env` and `ai-backend/.env`)
- **Pino** — structured JSON logging in the Node backend
- All AI streaming events are stored in SQLite for replay and debugging

---

## Contributing

1. Create a feature branch from `main` (e.g. `git checkout -b feature/my-thing`)
2. Follow the existing code style (ESLint + Prettier for TS, Black + Ruff for Python)
3. Write / update tests — coverage gates are enforced in CI
4. Open a PR; all three services must pass their test suites

---

## License

Built for the Goldman Sachs Hackathon. All rights reserved.
