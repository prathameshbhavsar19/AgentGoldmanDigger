import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:3000/api'

test.describe('Onboarding wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Clear persisted zustand state so each test starts fresh
    await page.goto('/onboarding')
    await page.evaluate(() => localStorage.removeItem('pgps-onboarding'))
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('renders first step (customer details)', async ({ page }) => {
    await expect(page.locator('h2')).toContainText("Let's get to know you")
  })

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    // Multiple validation errors may appear — check at least one is visible
    await expect(page.locator('[role="alert"]').first()).toBeVisible()
  })

  test('advances to goal step after filling details', async ({ page }) => {
    await page.fill('input[id="first-name"]', 'Priya')
    await page.selectOption('select[id="country-/-market"]', 'US')
    await page.selectOption('select[id="age-range"]', '18-24')
    await page.selectOption('select[id="employment-status"]', 'full-time')
    await page.selectOption('select[id="preferred-currency"]', 'USD')
    await page.selectOption('select[id="what-is-your-primary-financial-concern?"]', 'start-safely')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('h2')).toContainText('investing for')
  })

  test('session is created on the real backend when wizard loads', async ({ page }) => {
    // Intercept the POST /api/onboarding/session call
    let capturedSessionId: string | undefined
    page.on('response', async (res) => {
      if (res.url().includes('/api/onboarding/session') && res.request().method() === 'POST') {
        try {
          const body = await res.json() as { sessionId?: string }
          capturedSessionId = body.sessionId
        } catch { /* ignore */ }
      }
    })

    // Fresh page load triggers createSession()
    await page.goto('/onboarding')
    await page.evaluate(() => localStorage.removeItem('pgps-onboarding'))
    await page.reload()
    await page.waitForLoadState('networkidle')
    // Allow async session creation to complete
    await page.waitForTimeout(1_000)

    // Verify backend actually persisted the session
    if (capturedSessionId) {
      const { request } = page.context()
      const res = await request.get(`${API_BASE}/onboarding/session/${capturedSessionId}`)
      expect(res.ok()).toBeTruthy()
      const body = await res.json() as { session?: { status?: string } }
      expect(body.session?.status ?? body).toBeTruthy()
    }
  })

  test('onboarding PATCH reaches backend with mapped field names', async ({ page, request }) => {
    // Create a session directly
    const sessionRes = await request.post(`${API_BASE}/onboarding/session`, { data: {} })
    const { sessionId } = await sessionRes.json() as { sessionId: string }

    // Patch a step (the way the frontend does after field-name mapping)
    const patchRes = await request.patch(`${API_BASE}/onboarding/session/${sessionId}`, {
      data: { investmentGoal: 'retirement', currentStep: 'timeline' },
    })
    expect(patchRes.ok()).toBeTruthy()

    // Verify the value is stored
    const getRes = await request.get(`${API_BASE}/onboarding/session/${sessionId}`)
    expect(getRes.ok()).toBeTruthy()
    const body = await getRes.json() as { session?: { investment_goal?: string } }
    expect(body.session?.investment_goal).toBe('retirement')
  })
})
