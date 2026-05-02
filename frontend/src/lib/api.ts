// REST API client — all paths proxied to Node backend via vite.config.ts
const BASE = '/api'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${options.method ?? 'GET'} ${path} → ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ── Field name translation ─────────────────────────────────
// Frontend store uses short camelCase keys; backend Zod expects verbose keys.
// null means "drop this key — it is frontend-only".
const FIELD_MAP: Record<string, string | null> = {
  goal:             'investmentGoal',
  horizon:          'timeHorizon',
  capacity:         'monthlyInvestmentCapacity',
  savings:          'emergencySavings',
  familiarity:      'investmentFamiliarity',
  investmentStatus: 'currentInvestmentStatus',
  primaryConcern:   'primaryFinancialConcern',
  portfolioMethod:  null,   // frontend-only (upload/manual/skip), not a backend column
  incomeRange:      null,   // not in backend schema yet
}

// Keys that are identical in both frontend and backend (no rename needed)
const PASSTHROUGH = new Set([
  'firstName', 'lastName', 'email', 'country', 'currency',
  'ageRange', 'employmentStatus', 'riskReaction',
  'portfolioReviewIntent', 'consentGiven', 'currentStep',
])

export function toBackendShape(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (k in FIELD_MAP) {
      const mapped = FIELD_MAP[k]
      if (mapped !== null) out[mapped] = v  // remap
      // else drop (null)
    } else if (PASSTHROUGH.has(k)) {
      out[k] = v
    }
    // unrecognised keys are dropped silently
  }
  return out
}

// Inverse: reshape backend column names → frontend store keys for resume
const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(FIELD_MAP)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => [v as string, k])
)

export function fromBackendShape(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    out[REVERSE_MAP[k] ?? k] = v
  }
  return out
}

// ── Onboarding sessions ───────────────────────────────────
export interface SessionResponse {
  sessionId: string
  userId: string
  status: string
}

export function createSession(): Promise<SessionResponse> {
  return request('/onboarding/session', { method: 'POST', body: JSON.stringify({}) })
}

export function saveSessionStep(
  sessionId: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean }> {
  return request(`/onboarding/session/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(toBackendShape(data)),
  })
}

export function getSession(sessionId: string): Promise<Record<string, unknown>> {
  return request(`/onboarding/session/${sessionId}`).then((res) => {
    // The backend wraps the row in { session: {...} }
    const session = (res as { session?: Record<string, unknown> }).session ?? (res as Record<string, unknown>)
    return fromBackendShape(session)
  })
}

// ── Portfolio upload ──────────────────────────────────────
export interface UploadResponse { fileId: string; fileName: string }

export function uploadPortfolio(
  sessionId: string,
  file: File
): Promise<UploadResponse> {
  const fd = new FormData()
  fd.append('file', file)
  // session id is passed as header (backend reads x-session-id)
  return fetch(`${BASE}/portfolio/upload`, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: fd,
  }).then(async (res) => {
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<UploadResponse>
  })
}

export interface ManualHolding {
  assetName: string
  assetSymbol?: string
  assetType: string
  quantity?: number
  marketValue?: number
  currency: string
  sector?: string
}

export function submitManualPortfolio(
  sessionId: string,
  holdings: ManualHolding[]
): Promise<{ ok: boolean }> {
  return request('/portfolio/manual', {
    method: 'POST',
    body: JSON.stringify({ sessionId, holdings }),
  })
}

// ── Strategy ──────────────────────────────────────────────
export interface GenerateStrategyResponse { jobId: string }

export function generateStrategy(
  sessionId: string
): Promise<GenerateStrategyResponse> {
  return request('/strategy/generate', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  })
}

export interface ReportResponse {
  jobId: string
  status: string
  canvasJson?: Record<string, unknown>
}

export function getReport(jobId: string): Promise<ReportResponse> {
  return request(`/strategy/report/${jobId}`)
}

export function sendFollowUp(
  jobId: string,
  question: string
): Promise<{ ok: boolean }> {
  return request(`/strategy/${jobId}/follow-up`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
}
