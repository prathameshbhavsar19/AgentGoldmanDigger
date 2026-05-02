import { test, expect } from '@playwright/test'

test.describe('AI Canvas (mock mode)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to canvas with the mock jobId
    await page.goto('/canvas/job-mock-001')
    await page.waitForLoadState('networkidle')
  })

  test('shows Analysing status initially', async ({ page }) => {
    // Give the mock WS a moment to start
    await page.waitForTimeout(500)
    const statusPill = page.locator('[class*="rounded-full"]').filter({ hasText: /Analys|Ready/ })
    await expect(statusPill.first()).toBeVisible()
  })

  test('activity feed appears on large screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await expect(page.locator('aside[aria-label="AI Analyst Activity"]')).toBeVisible()
  })

  test('canvas modules appear after mock WS replay', async ({ page }) => {
    // Wait for analysis to complete (mock timeline ~14s; use longer timeout)
    await page.waitForSelector('[data-module-type="goal_summary"]', { timeout: 20000 })
    await expect(page.locator('[data-module-type="goal_summary"]')).toBeVisible()
  })

  test('Download button is disabled before ready', async ({ page }) => {
    await expect(page.getByTestId('btn-download')).toBeDisabled()
  })

  test('Download button enables after analysis_completed', async ({ page }) => {
    await page.waitForSelector('[data-module-type="next_steps"]', { timeout: 20000 })
    await expect(page.getByTestId('btn-download')).toBeEnabled()
  })

  test('Select this path button works in-canvas', async ({ page }) => {
    await page.waitForSelector('[data-testid="btn-select-path"]', { timeout: 20000 })
    await page.getByTestId('btn-select-path').click()
    await expect(page.locator('[data-testid="btn-select-path"]')).toContainText('selected')
  })
})
