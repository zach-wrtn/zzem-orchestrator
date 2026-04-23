import { test, expect } from '@playwright/test';

test('home loads and shows at least one sprint', async ({ page }) => {
  await page.goto('');
  await expect(page).toHaveTitle(/ZZEM Sprints/);
  const sprintHeadings = page.locator('h2, h1').filter({ hasText: /Sprint|UGC|Platform/ });
  await expect(sprintHeadings.first()).toBeVisible();
});
