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

test.describe('system components', () => {
  test('components list renders 5 entries', async ({ page }) => {
    await page.goto('system/components/');
    const cards = page.locator('[data-component-card]');
    await expect(cards).toHaveCount(5);
  });

  test('button detail renders demo iframe + variants', async ({ page }) => {
    await page.goto('system/components/button/');
    await expect(page.locator('.component-demo iframe')).toBeVisible();
    const variants = page.locator('.variant-pill');
    const n = await variants.count();
    expect(n).toBeGreaterThan(1);
  });

  test('variant pill updates iframe data-variant attribute', async ({ page }) => {
    await page.goto('system/components/button/');
    const secondPill = page.locator('.variant-pill').nth(1);
    const pillText = (await secondPill.textContent())?.trim() || '';
    await secondPill.click();
    await page.waitForTimeout(200);
    const dataVariant = await page.locator('.component-demo iframe').getAttribute('data-variant');
    expect(dataVariant?.toLowerCase()).toBe(pillText.toLowerCase());
  });

  test('tokens list shows resolved values', async ({ page }) => {
    await page.goto('system/components/button/');
    const rows = page.locator('.tokens-list li');
    const n = await rows.count();
    expect(n).toBeGreaterThan(0);
  });
});

test.describe('system nav + home', () => {
  test('TopBar System link navigates to /system/', async ({ page }) => {
    await page.goto('');
    await page.locator('a.sys-link').click();
    await expect(page).toHaveURL(/\/system\/?$/);
  });

  test('/system home shows foundations + components sections', async ({ page }) => {
    await page.goto('system/');
    const sections = page.locator('main > section');
    await expect(sections).toHaveCount(2);
  });

  test('/system/patterns renders empty state with deferred list', async ({ page }) => {
    await page.goto('system/patterns/');
    const deferred = page.locator('.deferred li');
    await expect(deferred).toHaveCount(7);
  });
});
