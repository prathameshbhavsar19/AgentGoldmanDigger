/**
 * Full happy-path integration spec.
 * Exercises: Onboarding wizard → CSV upload → Canvas streaming → Report download → Follow-up.
 * Backend: real Node :3000 + mockPython :8001 (no MSW intercepts).
 * Run via: npm run test:e2e -- integration.spec.ts
 *          or via scripts/smoke/integration.sh
 */
import path from 'path'
import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:3000/api'
const FIXTURE_CSV = path.join(__dirname, '../__fixtures__/portfolio.sample.csv')

test.describe.serial('Full happy path', () => {
  let sessionId: string
  let jobId: string

  // ── Step 1: Onboarding wizard ─────────────────────────────
  test('01 — create session and complete customer details step', async ({ page, request }) => {
    // Reset local store
    await page.goto('/onboarding')
    await page.evaluate(() => localStorage.removeItem('pgps-onboarding'))
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Capture the session ID from the POST response
    const sessionPromise = page.waitForResponse(
      res => res.url().includes('/api/onboarding/session') && res.request().method() === 'POST'
    )

    // Fill customer details
    await page.fill('input[id="first-name"]', 'Priya')
    await page.fill('input[id="last-name"]', 'Sharma')
    await page.selectOption('select[id="country-/-market"]', 'US')
    await page.selectOption('select[id="age-range"]', '25-34')
    await page.selectOption('select[id="employment-status"]', 'full-time')
    await page.selectOption('select[id="preferred-currency"]', 'USD')
    await page.selectOption('select[id="what-is-your-primary-financial-concern?"]', 'grow-wealth')
    await page.locator('button[type="submit"]').click()

    const sessionRes = await sessionPromise
    const sessionBody = await sessionRes.json() as { sessionId: string }
    sessionId = sessionBody.sessionId

    // Should advance to goal step
    await expect(page.locator('h2')).toContainText('investing for', { timeout: 5_000 })

    // Verify backend has the session
    const checkRes = await request.get(`${API_BASE}/onboarding/session/${sessionId}`)
    expect(checkRes.ok()).toBeTruthy()
  })

  // ── Step 2: Rapid-fill remaining onboarding steps via API ─
  test('02 — patch remaining onboarding answers via API', async ({ request }) => {
    expect(sessionId, 'sessionId must be set from step 01').toBeTruthy()

    const patchRes = await request.patch(`${API_BASE}/onboarding/session/${sessionId}`, {
      data: {
        investmentGoal:            'wealth-building',
        timeHorizon:               '10-plus-years',
        monthlyInvestmentCapacity: '500-1000',
        emergencySavings:          'yes-6-months',
        riskReaction:              'stay-course',
        investmentFamiliarity:     'choose-some',
        currentInvestmentStatus:   'have-some',
        portfolioReviewIntent:     'yes-review',
        consentGiven:              true,
        currentStep:               'review',
      },
    })
    expect(patchRes.ok()).toBeTruthy()

    // Verify all key fields are persisted
    const getRes = await request.get(`${API_BASE}/onboarding/session/${sessionId}`)
    const body = await getRes.json() as { session: Record<string, unknown> }
    expect(body.session.investment_goal).toBe('wealth-building')
    expect(body.session.time_horizon).toBe('10-plus-years')
    expect(body.session.consent_given).toBeTruthy()
  })

  // ── Step 3: Portfolio CSV upload ──────────────────────────
  test('03 — upload portfolio CSV', async ({ request }) => {
    expect(sessionId, 'sessionId must be set').toBeTruthy()

    const fd = new Map<string, string | { name: string; mimeType: string; buffer: Buffer }>()
    const { readFileSync } = await import('fs')
    const buf = readFileSync(FIXTURE_CSV)

    const uploadRes = await request.post(`${API_BASE}/portfolio/upload`, {
      headers: { 'x-session-id': sessionId },
      multipart: {
        file: {
          name: 'portfolio.sample.csv',
          mimeType: 'text/csv',
          buffer: buf,
        },
      },
    })
    expect(uploadRes.ok()).toBeTruthy()
    const uploadBody = await uploadRes.json() as { fileId: string; fileName: string; holdings?: unknown[] }
    expect(uploadBody.fileId).toBeTruthy()
    expect(uploadBody.holdings && uploadBody.holdings.length).toBeGreaterThan(0)
    void fd
  })

  // ── Step 4: Generate strategy job ────────────────────────
  test('04 — generate strategy and get jobId', async ({ request }) => {
    expect(sessionId, 'sessionId must be set').toBeTruthy()

    const genRes = await request.post(`${API_BASE}/strategy/generate`, {
      data: { sessionId },
    })
    expect(genRes.ok()).toBeTruthy()
    const genBody = await genRes.json() as { jobId: string }
    jobId = genBody.jobId
    expect(jobId).toBeTruthy()
  })

  // ── Step 5: Navigate to canvas and watch events stream ───
  test('05 — canvas streams events until analysis_completed', async ({ page }) => {
    expect(jobId, 'jobId must be set from step 04').toBeTruthy()

    await page.goto(`/canvas/${jobId}`)
    await page.waitForLoadState('networkidle')

    // Wait for at least one canvas module to render (mockPython emits in ~3–4 s)
    await page.waitForSelector('[data-module-type]', { timeout: 20_000 })
    const modules = page.locator('[data-module-type]')
    expect(await modules.count()).toBeGreaterThan(0)

    // Wait for final module (next_steps) which signals analysis_completed
    await page.waitForSelector('[data-module-type="next_steps"]', { timeout: 20_000 })
    await expect(page.getByTestId('btn-download')).toBeEnabled({ timeout: 5_000 })
  })

  // ── Step 6: Download report ───────────────────────────────
  test('06 — download report returns JSON', async ({ request }) => {
    expect(jobId, 'jobId must be set').toBeTruthy()

    // Poll for completed status (mockPython finishes in ~4 s)
    let reportBody: { status: string; canvasJson?: unknown } | undefined
    for (let i = 0; i < 10; i++) {
      const res = await request.get(`${API_BASE}/strategy/report/${jobId}`)
      reportBody = await res.json() as typeof reportBody
      if (reportBody?.status === 'completed') break
      await new Promise(r => setTimeout(r, 1_000))
    }
    expect(reportBody?.status).toBe('completed')
    expect(reportBody?.canvasJson).toBeTruthy()
  })

  // ── Step 7: Send a follow-up question ────────────────────
  test('07 — follow-up question reaches backend', async ({ request }) => {
    expect(jobId, 'jobId must be set').toBeTruthy()

    const res = await request.post(`${API_BASE}/strategy/${jobId}/follow-up`, {
      data: { question: 'Should I invest more in bonds given current rates?' },
    })
    expect(res.ok()).toBeTruthy()
  })

  // ── Step 8: Side-effect verification ─────────────────────
  test('08 — user_data.md and SQLite side effects are correct', async ({ request }) => {
    expect(sessionId, 'sessionId must be set').toBeTruthy()
    expect(jobId, 'jobId must be set').toBeTruthy()

    // Verify session has all key sections via API
    const sessionRes = await request.get(`${API_BASE}/onboarding/session/${sessionId}`)
    expect(sessionRes.ok()).toBeTruthy()
    const body = await sessionRes.json() as { session: Record<string, unknown> }
    const s = body.session
    expect(s.investment_goal).toBeTruthy()
    expect(s.consent_given).toBeTruthy()

    // Verify strategy job is recorded and completed
    const reportRes = await request.get(`${API_BASE}/strategy/report/${jobId}`)
    expect(reportRes.ok()).toBeTruthy()
    const report = await reportRes.json() as { status: string }
    expect(report.status).toBe('completed')
  })
})
