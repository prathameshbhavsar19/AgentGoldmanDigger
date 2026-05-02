import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { name: '375 mobile', width: 375, height: 812 },
  { name: '768 tablet', width: 768, height: 1024 },
  { name: '1024 laptop', width: 1024, height: 768 },
  { name: '1440 desktop', width: 1440, height: 900 },
]

for (const viewport of VIEWPORTS) {
  test.describe(`Responsive: ${viewport.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
    })

    test('landing page renders without overflow', async ({ page }) => {
      await page.goto('/')
      const body = page.locator('body')
      const bodyWidth = await body.evaluate(el => el.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 16) // allow scrollbar
    })

    test('onboarding renders correctly', async ({ page }) => {
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h2')).toBeVisible()
    })
  })
}
