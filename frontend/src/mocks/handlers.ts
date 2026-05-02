import { http, HttpResponse } from 'msw'

let sessionCounter = 0

// ── REST handlers ──────────────────────────────────────────
export const handlers = [
  // Create session
  http.post('/api/onboarding/session', () => {
    sessionCounter++
    return HttpResponse.json({
      sessionId: `mock-session-${sessionCounter}`,
      userId: `mock-user-${sessionCounter}`,
      status: 'started',
    })
  }),

  // Save session step
  http.patch('/api/onboarding/session/:sessionId', () =>
    HttpResponse.json({ ok: true })
  ),

  // Get session
  http.get('/api/onboarding/session/:sessionId', ({ params }) =>
    HttpResponse.json({ sessionId: params.sessionId, status: 'in_progress' })
  ),

  // Portfolio upload
  http.post('/api/portfolio/upload', async () =>
    HttpResponse.json({ fileId: 'mock-file-001', fileName: 'portfolio.sample.csv' })
  ),

  // Portfolio manual
  http.post('/api/portfolio/manual', () =>
    HttpResponse.json({ ok: true })
  ),

  // Generate strategy
  http.post('/api/strategy/generate', () =>
    HttpResponse.json({ jobId: 'job-mock-001' })
  ),

  // Get report
  http.get('/api/strategy/report/:jobId', ({ params }) =>
    HttpResponse.json({
      jobId: params.jobId,
      status: 'completed',
      reportTitle: 'Your Personalised Portfolio Strategy',
      canvasJson: { modules: [] },
    })
  ),

  // Follow-up
  http.post('/api/strategy/:jobId/follow-up', () =>
    HttpResponse.json({ ok: true })
  ),
]
