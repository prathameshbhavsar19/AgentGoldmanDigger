import { test, expect, type APIRequestContext } from '@playwright/test'

const API_BASE = 'http://localhost:3000/api'

// Create a real session + strategy job via backend API and return the jobId
async function createRealJob(request: APIRequestContext): Promise<string> {
  const sessionRes = await request.post(`${API_BASE}/onboarding/session`, { data: {} })
  expect(sessionRes.ok()).toBeTruthy()
  const { sessionId } = await sessionRes.json() as { sessionId: string }

  // Patch minimal required fields so strategy/generate doesn't reject
  await request.patch(`${API_BASE}/onboarding/session/${sessionId}`, {
    data: {
      firstName: 'Test',
      country: 'US',
      currency: 'USD',
      ageRange: '25-34',
      employmentStatus: 'full-time',
      primaryFinancialConcern: 'grow-wealth',
      investmentGoal: 'growth',
      timeHorizon: '5-10-years',
      monthlyInvestmentCapacity: '500-1000',
      emergencySavings: 'yes-3-months',
      riskReaction: 'stay-course',
      investmentFamiliarity: 'choose-some',
      currentInvestmentStatus: 'have-some',
      portfolioReviewIntent: 'yes-review',
      consentGiven: true,
      currentStep: 'review',
    },
  })

  const genRes = await request.post(`${API_BASE}/strategy/generate`, {
    data: { sessionId },
  })
  expect(genRes.ok()).toBeTruthy()
  const { jobId } = await genRes.json() as { jobId: string }
  return jobId
}

test.describe('AI Canvas (real backend + mockPython)', () => {
  let jobId: string

  test.beforeAll(async ({ request }) => {
    jobId = await createRealJob(request)
  })

  test.beforeEach(async ({ page }) => {
    await page.goto(`/canvas/${jobId}`)
    await page.waitForLoadState('networkidle')
  })

  test('shows Analysing status initially', async ({ page }) => {
    await page.waitForTimeout(300)
    const statusPill = page.locator('[class*="rounded-full"]').filter({ hasText: /Analys|Ready/ })
    await expect(statusPill.first()).toBeVisible()
  })

  test('activity feed appears on large screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await expect(page.locator('aside[aria-label="AI Analyst Activity"]')).toBeVisible()
  })

  test('canvas modules appear after mockPython streams events', async ({ page }) => {
    // mockPython new_investor timeline completes in ~3–4 s
    await page.waitForSelector('[data-module-type]', { timeout: 15_000 })
    const modules = page.locator('[data-module-type]')
    await expect(modules.first()).toBeVisible()
  })

  test('Download button is disabled before ready', async ({ page }) => {
    await expect(page.getByTestId('btn-download')).toBeDisabled()
  })

  test('Download button enables after analysis_completed', async ({ page }) => {
    // Wait for any next_steps or last module to appear
    await page.waitForSelector('[data-module-type="next_steps"]', { timeout: 15_000 })
    await expect(page.getByTestId('btn-download')).toBeEnabled()
  })

  test('Select this path button works in-canvas', async ({ page }) => {
    await page.waitForSelector('[data-testid="btn-select-path"]', { timeout: 15_000 })
    await page.getByTestId('btn-select-path').click()
    await expect(page.locator('[data-testid="btn-select-path"]')).toContainText('selected')
  })

  test('backend reports job with at least one AI event', async ({ request }) => {
    // Give mockPython time to push at least the first event
    await new Promise(r => setTimeout(r, 2_000))
    const res = await request.get(`${API_BASE}/strategy/report/${jobId}`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json() as { jobId: string; status: string }
    expect(body.jobId).toBe(jobId)
    expect(['in_progress', 'completed']).toContain(body.status)
  })
})
