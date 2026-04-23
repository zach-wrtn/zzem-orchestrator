// sprint-gallery/tests/e2e/system.spec.ts
import { test, expect } from '@playwright/test';

test.describe('system foundations', () => {
  test('foundations list renders all 6 entries', async ({ page }) => {
    await page.goto('system/foundations/');
    const cards = page.locator('[data-foundation-card]');
    await expect(cards).toHaveCount(6);
  });

  test('color route renders swatch section', async ({ page }) => {
    await page.goto('system/foundations/color/');
    await expect(page.locator('.swatch-section')).toBeVisible();
    const swatches = page.locator('.swatch');
    const count = await swatches.count();
    expect(count).toBeGreaterThan(5);
  });

  test('typography route renders specimen table', async ({ page }) => {
    await page.goto('system/foundations/typography/');
    await expect(page.locator('.type-section table')).toBeVisible();
  });

  test('motion route has interactive play buttons', async ({ page }) => {
    await page.goto('system/foundations/motion/');
    const plays = page.locator('[data-play]');
    await expect(plays.first()).toBeVisible();
  });
});
