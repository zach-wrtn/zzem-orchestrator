import { test, expect } from '@playwright/test';

test.use({
  colorScheme: 'dark',
  reducedMotion: 'reduce',
});

test.describe('prefers-reduced-motion', () => {
  test('home → preview → back still works', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('');
    const hero = page.locator('.panel .hero').first();
    const href = await hero.getAttribute('href');
    await hero.click();
    await page.waitForURL(href!);
    await expect(page.locator('.device iframe')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForURL(/zzem-orchestrator\/?$/);
  });

  test('card hover transform is suppressed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('');
    await page.waitForTimeout(400);
    const card = page.locator('.panel .hero').first();
    await card.hover();
    await page.waitForTimeout(200);
    const transform = await card.evaluate((el) => getComputedStyle(el).transform);
    // Under reduced-motion, transform should be none, empty, or the identity matrix (no translation).
    const isNoTranslation =
      transform === 'none' ||
      transform === '' ||
      transform === 'matrix(1, 0, 0, 1, 0, 0)';
    expect(isNoTranslation).toBe(true);
  });
});
