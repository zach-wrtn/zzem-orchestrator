import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('mobile story stack', () => {
  test('horizontal snap track is visible', async ({ page }) => {
    await page.goto('');
    const stack = page.locator('.stack').first();
    await expect(stack).toBeVisible();
    const overflowX = await stack.locator('.track').evaluate(
      (el) => getComputedStyle(el).scrollSnapType,
    );
    expect(overflowX).toMatch(/x mandatory/);
  });

  test('side grid is hidden on mobile', async ({ page }) => {
    await page.goto('');
    const grid = page.locator('.side-grid').first();
    await expect(grid).toBeHidden();
  });
});
