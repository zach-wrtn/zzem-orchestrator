import { test, expect } from '@playwright/test';

test.describe('preview route', () => {
  test('direct navigation renders iframe for existing prototype', async ({ page }) => {
    await page.goto('prototypes/ugc-platform-002/app-001/');
    const iframe = page.locator('.device iframe');
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src).toMatch(/prototypes\/ugc-platform-002\/app\/app-001\/prototype\.html$/);
  });

  test('ESC key navigates back', async ({ page }) => {
    await page.goto('');
    await page.goto('prototypes/ugc-platform-002/app-001/');
    await page.keyboard.press('Escape');
    await page.waitForURL(/zzem-orchestrator\/?$/);
    expect(page.url()).toMatch(/zzem-orchestrator\/?$/);
  });

  test('clicking a home hero navigates to preview URL', async ({ page }) => {
    await page.goto('');
    const hero = page.locator('.panel .hero').first();
    const href = await hero.getAttribute('href');
    await hero.click();
    await page.waitForURL(href!);
    await expect(page.locator('.device iframe')).toBeVisible();
  });

  test('close control receives focus on preview mount', async ({ page }) => {
    await page.goto('prototypes/ugc-platform-002/app-001/');
    const close = page.locator('[data-close]');
    await expect(close).toBeFocused();
  });
});
