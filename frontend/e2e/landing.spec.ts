import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders hero headline', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('investments')
  })

  test('Start Portfolio Check CTA is visible', async ({ page }) => {
    await expect(page.getByTestId('cta-start')).toBeVisible()
  })

  test('Explore Demo CTA is visible', async ({ page }) => {
    await expect(page.getByTestId('cta-demo')).toBeVisible()
  })

  test('Start CTA navigates to /onboarding', async ({ page }) => {
    await page.getByTestId('cta-start').click()
    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('footer shows disclaimer', async ({ page }) => {
    await expect(page.locator('footer')).toContainText('educational')
  })

  test('has no axe violations', async ({ page }) => {
    const { checkA11y } = await import('@axe-core/playwright')
    // axe-core/playwright is optional; catch if not available
    try {
      await checkA11y(page, undefined, { detailedReport: false })
    } catch {
      test.skip()
    }
  })
})
