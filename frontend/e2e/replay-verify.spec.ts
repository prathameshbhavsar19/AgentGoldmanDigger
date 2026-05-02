/**
 * Fast verification tests against COMPLETED jobs (WS replay path).
 * Runs in seconds - no AI wait needed.
 */
import { test, expect } from '@playwright/test'

const APP = 'http://localhost:8080'
const COMPLETED_JOB = 'a8bd1247-61f2-4984-8bf9-8f7d2f4aa32e'

test.describe('WS replay verification', () => {
  test('strategy_options renders from replay', async ({ page }) => {
    await page.goto(`${APP}/canvas/${COMPLETED_JOB}`)
    await expect(page.getByTestId('strategy-options-module')).toBeVisible({ timeout: 10_000 })
  })

  test('≥3 strategy option cards from replay', async ({ page }) => {
    await page.goto(`${APP}/canvas/${COMPLETED_JOB}`)
    await expect(page.getByTestId('strategy-options-module')).toBeVisible({ timeout: 10_000 })
    const cards = page.locator('[data-testid^="strategy-option-"]')
    await expect(async () => {
      expect(await cards.count()).toBeGreaterThanOrEqual(3)
    }).toPass({ timeout: 5_000 })
  })

  test('important_considerations renders from replay', async ({ page }) => {
    await page.goto(`${APP}/canvas/${COMPLETED_JOB}`)
    const mod = page.getByTestId('important-considerations-module')
    await expect(mod).toBeVisible({ timeout: 10_000 })
    expect(await mod.locator('li').count()).toBeGreaterThanOrEqual(1)
  })

  test('next_steps action plan renders', async ({ page }) => {
    await page.goto(`${APP}/canvas/${COMPLETED_JOB}`)
    await page.waitForTimeout(3_000)
    const mod = page.getByTestId('next-steps-module')
    await expect(mod).toBeVisible({ timeout: 10_000 })
    const items = mod.locator('li')
    expect(await items.count()).toBeGreaterThanOrEqual(1)
  })

  test('clicking strategy option expands details', async ({ page }) => {
    await page.goto(`${APP}/canvas/${COMPLETED_JOB}`)
    await expect(page.getByTestId('strategy-options-module')).toBeVisible({ timeout: 10_000 })
    const firstCard = page.locator('[data-testid^="strategy-option-"]').first()
    await firstCard.locator('button').first().click()
    await expect(firstCard.locator('[id^="option-detail-"]')).toBeVisible({ timeout: 5_000 })
  })
})
