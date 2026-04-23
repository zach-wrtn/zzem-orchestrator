import { test, expect } from '@playwright/test';

test.describe('design tokens', () => {
  test('warm off-black bg and coral accent', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('');
    const root = page.locator(':root');
    const bg = await root.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--bg').trim(),
    );
    const accent = await root.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--accent').trim(),
    );
    expect(bg.toLowerCase()).toBe('#0f0d0c');
    expect(accent.toLowerCase()).toBe('#ff7a63');
  });

  test('body uses Pretendard in the font stack', async ({ page }) => {
    await page.goto('');
    const fontFamily = await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily,
    );
    expect(fontFamily).toMatch(/Pretendard/i);
  });

  test('body font size is 15px', async ({ page }) => {
    await page.goto('');
    const fontSize = await page.evaluate(() =>
      getComputedStyle(document.body).fontSize,
    );
    expect(fontSize).toBe('15px');
  });
});
