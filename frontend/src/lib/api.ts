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
    body: JSON.stringify(data),
  })
}

export function getSession(sessionId: string): Promise<Record<string, unknown>> {
  return request(`/onboarding/session/${sessionId}`)
}

// ── Portfolio upload ──────────────────────────────────────
export interface UploadResponse { fileId: string; fileName: string }

export function uploadPortfolio(
  sessionId: string,
  file: File
): Promise<UploadResponse> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('sessionId', sessionId)
  return fetch(`${BASE}/portfolio/upload`, { method: 'POST', body: fd })
    .then(async (res) => {
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
