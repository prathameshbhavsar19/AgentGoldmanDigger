import { test, expect } from '@playwright/test'

test.describe('Onboarding wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
  })

  test('renders first step (customer details)', async ({ page }) => {
    await expect(page.locator('h2')).toContainText("Let's get to know you")
  })

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('[role="alert"]')).toBeVisible()
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
})
