/**
 * Production-environment E2E test: ONE real job, ALL assertions.
 *
 * Runs against the full live stack with no mocks:
 *   - Real Python AI backend (Anthropic Claude + yfinance + Tavily)
 *   - Real Node Canvas LLM (Anthropic Claude demystifier)
 *   - Real frontend (Vite, no MSW)
 *
 * One job runs end-to-end (~5-7 min), and every UI assertion is made on it.
 */

import { test, expect, type APIRequestContext } from '@playwright/test'

const API = 'http://localhost:3000'
const APP = 'http://localhost:8080'
const PIPELINE_TIMEOUT_MS = 15 * 60_000

async function createSession(request: APIRequestContext): Promise<string> {
  const r = await request.post(`${API}/api/onboarding/session`, {
    data: { userHint: {} },
    headers: { 'Content-Type': 'application/json' },
  })
  expect(r.status()).toBe(201)
  const body = (await r.json()) as { sessionId: string }
  return body.sessionId
}

async function patchSession(request: APIRequestContext, sessionId: string, data: Record<string, unknown>) {
  const r = await request.patch(`${API}/api/onboarding/session/${sessionId}`, {
    data,
    headers: { 'Content-Type': 'application/json' },
  })
  expect(r.ok()).toBeTruthy()
}

async function startJob(request: APIRequestContext, sessionId: string): Promise<string> {
  const r = await request.post(`${API}/api/strategy/generate`, {
    data: { sessionId },
    headers: { 'Content-Type': 'application/json' },
  })
  expect(r.ok()).toBeTruthy()
  const body = (await r.json()) as { jobId: string }
  return body.jobId
}

test.describe.configure({ mode: 'serial' })

test.describe('Production stack — first-time investor', () => {
  let jobId: string

  test.setTimeout(PIPELINE_TIMEOUT_MS + 60_000)

  test('seed onboarding + start job', async ({ request }) => {
    const sessionId = await createSession(request)
    await patchSession(request, sessionId, {
      firstName: 'Alex',
      country: 'US',
      investmentGoal: 'Long-term wealth building',
      timeHorizon: '10+ years',
      monthlySavings: '300',
      investmentFamiliarity: 'beginner',
      riskTolerance: 'conservative',
      consentGiven: true,
      currentStep: 'review',
    })
    jobId = await startJob(request, sessionId)
    expect(jobId).toMatch(/[0-9a-f-]{36}/)
    console.log(`[real-stack] job ${jobId} started`)
  })

  test('canvas page shows building state then renders modules', async ({ page }) => {
    expect(jobId, 'job must be seeded by previous test').toBeTruthy()
    await page.goto(`${APP}/canvas/${jobId}`)

    // Strategy options module is the strongest "I am rendered" signal.
    await expect(page.getByTestId('strategy-options-module')).toBeVisible({
      timeout: PIPELINE_TIMEOUT_MS,
    })
    console.log(`[real-stack] strategy_options module rendered`)
  })

  test('strategy_options has ≥3 risk-tinted cards', async ({ page }) => {
    await page.goto(`${APP}/canvas/${jobId}`)
    await expect(page.getByTestId('strategy-options-module')).toBeVisible({
      timeout: PIPELINE_TIMEOUT_MS,
    })

    const cards = page.locator('[data-testid^="strategy-option-"]')
    await expect(async () => {
      const count = await cards.count()
      expect(count).toBeGreaterThanOrEqual(3)
    }).toPass({ timeout: 30_000 })

    const finalCount = await cards.count()
    console.log(`[real-stack] ${finalCount} strategy options rendered`)
  })

  test('clicking a strategy option expands it', async ({ page }) => {
    await page.goto(`${APP}/canvas/${jobId}`)
    await expect(page.getByTestId('strategy-options-module')).toBeVisible({
      timeout: PIPELINE_TIMEOUT_MS,
    })

    const firstCard = page.locator('[data-testid^="strategy-option-"]').first()
    await firstCard.locator('button').first().click()
    await expect(firstCard.locator('[id^="option-detail-"]')).toBeVisible({ timeout: 5_000 })
  })

  test('important_considerations has ≥1 disclosure', async ({ page }) => {
    await page.goto(`${APP}/canvas/${jobId}`)
    const considerations = page.getByTestId('important-considerations-module')
    await expect(considerations).toBeVisible({ timeout: PIPELINE_TIMEOUT_MS })
    const items = considerations.locator('li')
    const count = await items.count()
    expect(count).toBeGreaterThanOrEqual(1)
    console.log(`[real-stack] ${count} disclosures rendered`)
  })
})
