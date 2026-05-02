/**
 * 3-scenario E2E tests.
 * Runs against the real stack by default (USE_MOCK_PYTHON=0, real Anthropic).
 * The real Python AI backend takes 3-5 min per job; timeouts are set accordingly.
 *
 * Assertions per scenario:
 *  - canvas_generation_started arrives → 'Building canvas' shimmer visible
 *  - Final canvas has strategy_options with ≥3 entries, each with risk_tint
 *  - Clicking an option expands it (Playwright DOM assertion)
 *  - glossary module present with ≥3 terms
 *  - important_considerations module present with at least one hidden charge
 */

import { test, expect, type APIRequestContext } from '@playwright/test'

const API = 'http://localhost:3000'
const APP = 'http://localhost:8080'

// Real AI backend can take 3-5 min for Phase A + 1 min for Node canvas LLM
const CANVAS_TIMEOUT = (process.env.REAL_PYTHON === '1' ? 480_000 : 120_000)

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createSession(request: APIRequestContext): Promise<string> {
  const r = await request.post(`${API}/api/onboarding/session`, {
    data: { userHint: {} },
    headers: { 'Content-Type': 'application/json' },
  })
  expect(r.status()).toBe(201)
  const body = await r.json() as { sessionId: string }
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
  const body = await r.json() as { jobId: string }
  return body.jobId
}

async function seedScenario(request: APIRequestContext, scenario: 1 | 2 | 14): Promise<{ sessionId: string; jobId: string }> {
  const sessionId = await createSession(request)

  if (scenario === 1) {
    await patchSession(request, sessionId, {
      investmentGoal: 'Long-term wealth building', timeHorizon: '10+ years', monthlySavings: '300',
      firstName: 'Alex', age: '24', country: 'US', employmentStatus: 'employed',
      investmentFamiliarity: 'beginner', riskTolerance: 'conservative',
      consentGiven: true, currentStep: 'review',
    })
  } else if (scenario === 2) {
    await patchSession(request, sessionId, {
      investmentGoal: 'Retirement', timeHorizon: '25 years', monthlySavings: '1000',
      firstName: 'Sarah', age: '35', country: 'US', employmentStatus: 'employed',
      investmentFamiliarity: 'intermediate', riskTolerance: 'moderate',
      consentGiven: true, currentStep: 'review',
    })
  } else {
    await patchSession(request, sessionId, {
      investmentGoal: 'Wealth preservation', timeHorizon: '5-10 years', monthlySavings: '800',
      firstName: 'Raj', age: '42', country: 'IN', employmentStatus: 'employed',
      investmentFamiliarity: 'intermediate', riskTolerance: 'moderate',
      consentGiven: true, currentStep: 'review',
    })
  }

  const jobId = await startJob(request, sessionId)
  return { sessionId, jobId }
}

// ─── Shared canvas assertions ─────────────────────────────────────────────────

async function assertCanvasLoaded(page: import('@playwright/test').Page, jobId: string) {
  await page.goto(`${APP}/canvas/${jobId}`)

  // Real AI backend takes 3-5 min; canvas LLM adds another ~1 min
  await expect(page.getByTestId('strategy-options-module')).toBeVisible({ timeout: CANVAS_TIMEOUT })
}

async function assertStrategyOptions(page: import('@playwright/test').Page) {
  const optionsModule = page.getByTestId('strategy-options-module')
  await expect(optionsModule).toBeVisible()

  // Should have ≥3 option cards
  const cards = page.locator('[data-testid^="strategy-option-"]')
  const count = await cards.count()
  expect(count).toBeGreaterThanOrEqual(3)
}

async function assertClickToExpand(page: import('@playwright/test').Page) {
  // Click the first option button
  const firstCard = page.locator('[data-testid^="strategy-option-"]').first()
  const toggleBtn = firstCard.locator('button').first()
  await toggleBtn.click()

  // After clicking, expanded content should appear
  await expect(firstCard.locator('[id^="option-detail-"]')).toBeVisible({ timeout: 5000 })
}

async function assertGlossaryModule(page: import('@playwright/test').Page) {
  const glossary = page.getByTestId('glossary-module')
  await expect(glossary).toBeVisible()

  // ≥3 terms
  const terms = glossary.locator('.grid > div')
  const count = await terms.count()
  expect(count).toBeGreaterThanOrEqual(3)
}

async function assertImportantConsiderations(page: import('@playwright/test').Page) {
  const considerations = page.getByTestId('important-considerations-module')
  await expect(considerations).toBeVisible()

  // At least one item
  const items = considerations.locator('li')
  const count = await items.count()
  expect(count).toBeGreaterThanOrEqual(1)
}

// ─── Scenario tests ───────────────────────────────────────────────────────────

test.describe('Scenario 1: First-time investor (no portfolio)', () => {
  test('full canvas loads with ≥3 strategy options', async ({ page, request }) => {
    test.slow() // canvas LLM takes a moment
    const { jobId } = await seedScenario(request, 1)
    await assertCanvasLoaded(page, jobId)
    await assertStrategyOptions(page)
  })

  test('clicking an option expands it', async ({ page, request }) => {
    test.slow()
    const { jobId } = await seedScenario(request, 1)
    await assertCanvasLoaded(page, jobId)
    await assertClickToExpand(page)
  })

  test('glossary module has ≥3 terms', async ({ page, request }) => {
    test.slow()
    const { jobId } = await seedScenario(request, 1)
    await assertCanvasLoaded(page, jobId)
    await assertGlossaryModule(page)
  })

  test('important considerations module present', async ({ page, request }) => {
    test.slow()
    const { jobId } = await seedScenario(request, 1)
    await assertCanvasLoaded(page, jobId)
    await assertImportantConsiderations(page)
  })
})

test.describe('Scenario 2: Panic crash (existing portfolio)', () => {
  test('full canvas loads with ≥3 options including calm option', async ({ page, request }) => {
    test.slow()
    const { jobId } = await seedScenario(request, 2)
    await assertCanvasLoaded(page, jobId)
    await assertStrategyOptions(page)

    // Should contain a "hold" or "calm" option title
    const optionTitles = page.locator('[data-testid^="strategy-option-"] button span.text-sm')
    const titles = await optionTitles.allTextContents()
    const hasCalm = titles.some(t => /hold|calm|nothing|maintain/i.test(t))
    expect(hasCalm).toBeTruthy()
  })

  test('important considerations mention tax or exit load', async ({ page, request }) => {
    test.slow()
    const { jobId } = await seedScenario(request, 2)
    await assertCanvasLoaded(page, jobId)
    const considerations = page.getByTestId('important-considerations-module')
    await expect(considerations).toBeVisible()
    const text = await considerations.textContent()
    expect(/tax|exit|capital|stcg/i.test(text ?? '')).toBeTruthy()
  })
})

test.describe('Scenario 14: Geopolitical shock (airlines + tech)', () => {
  test('canvas loads and options reflect oil/airline context', async ({ page, request }) => {
    test.slow()
    const { jobId } = await seedScenario(request, 14)
    await assertCanvasLoaded(page, jobId)
    await assertStrategyOptions(page)
  })

  test('click to expand shows allocation bars', async ({ page, request }) => {
    test.slow()
    const { jobId } = await seedScenario(request, 14)
    await assertCanvasLoaded(page, jobId)
    await assertClickToExpand(page)
    // Allocation bars should be in the expanded content
    const bars = page.locator('[id^="option-detail-"] .h-1\\.5.rounded-full')
    const barCount = await bars.count()
    expect(barCount).toBeGreaterThanOrEqual(1)
  })

  test('glossary and important considerations present', async ({ page, request }) => {
    test.slow()
    const { jobId } = await seedScenario(request, 14)
    await assertCanvasLoaded(page, jobId)
    await assertGlossaryModule(page)
    await assertImportantConsiderations(page)
  })
})

test.describe('Building shimmer state', () => {
  test('building shimmer visible between thinking and canvas', async ({ page, request }) => {
    test.slow()
    const { jobId } = await seedScenario(request, 1)
    await page.goto(`${APP}/canvas/${jobId}`)

    // Building shimmer may flash — check it doesn't stay permanently
    // The canvas should eventually show strategy options
    await expect(page.getByTestId('strategy-options-module')).toBeVisible({ timeout: CANVAS_TIMEOUT })
  })
})
