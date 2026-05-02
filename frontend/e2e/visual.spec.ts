import { test, expect } from '@playwright/test'

// Visual regression snapshots for key pages
// Run with: npm run test:e2e -- visual.spec.ts

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

  test('canvas empty state snapshot', async ({ page }) => {
    await page.goto('/canvas/job-mock-001')
    // Wait for skeleton/empty state only (don't wait for WS)
    await page.waitForTimeout(300)
    await expect(page).toHaveScreenshot('canvas-empty.png', { maxDiffPixels: 200 })
  })

  test('canvas final state snapshot', async ({ page }) => {
    await page.goto('/canvas/job-mock-001')
    await page.waitForSelector('[data-module-type="next_steps"]', { timeout: 20000 })
    await expect(page).toHaveScreenshot('canvas-final.png', { maxDiffPixels: 500 })
  })
})
