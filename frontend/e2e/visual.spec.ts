import { test, expect, type APIRequestContext } from '@playwright/test'

const API_BASE = 'http://localhost:3000/api'

async function createRealJob(request: APIRequestContext): Promise<string> {
  const sessionRes = await request.post(`${API_BASE}/onboarding/session`, { data: {} })
  expect(sessionRes.ok()).toBeTruthy()
  const { sessionId } = await sessionRes.json() as { sessionId: string }

  await request.patch(`${API_BASE}/onboarding/session/${sessionId}`, {
    data: {
      firstName: 'Visual',
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

  const genRes = await request.post(`${API_BASE}/strategy/generate`, { data: { sessionId } })
  expect(genRes.ok()).toBeTruthy()
  const { jobId } = await genRes.json() as { jobId: string }
  return jobId
}

// Visual regression snapshots for key pages
// Run with: npm run test:e2e -- visual.spec.ts
// NOTE: Screenshots must be re-recorded once the real-data canvas renders.
// Delete existing .png snapshots and run with --update-snapshots to baseline them.

test.describe('Visual snapshots', () => {
  test('landing page snapshot', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('landing.png', { maxDiffPixels: 100 })
  })

  test('onboarding step 1 snapshot', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('onboarding-step1.png', { maxDiffPixels: 100 })
  })

  test('canvas streaming state snapshot', async ({ page, request }) => {
    const jobId = await createRealJob(request)
    await page.goto(`/canvas/${jobId}`)
    // Give WS a moment to start streaming before snapshotting
    await page.waitForTimeout(600)
    await expect(page).toHaveScreenshot('canvas-streaming.png', { maxDiffPixels: 500 })
  })

  test('canvas final state snapshot', async ({ page, request }) => {
    const jobId = await createRealJob(request)
    await page.goto(`/canvas/${jobId}`)
    await page.waitForSelector('[data-module-type="next_steps"]', { timeout: 15_000 })
    await expect(page).toHaveScreenshot('canvas-final.png', { maxDiffPixels: 500 })
  })
})
