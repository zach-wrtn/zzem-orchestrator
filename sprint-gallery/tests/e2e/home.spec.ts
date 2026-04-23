import { test, expect } from '@playwright/test';

test.describe('home snap stream', () => {
  test('vertical snap mandatory is set on main container', async ({ page }) => {
    await page.goto('');
    const snapType = await page.evaluate(() => {
      const main = document.querySelector('.stream');
      return main ? getComputedStyle(main).scrollSnapType : null;
    });
    expect(snapType).toMatch(/y mandatory/);
  });

  test('each sprint has its own panel with snap-align start', async ({ page }) => {
    await page.goto('');
    const panels = page.locator('.panel[data-sprint-slug]');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(4);
    const snapAlign = await panels.first().evaluate((el) => getComputedStyle(el).scrollSnapAlign);
    expect(snapAlign).toBe('start');
  });

  test('hero anchor carries a view-transition-name', async ({ page }) => {
    await page.goto('');
    const hero = page.locator('.panel .hero').first();
    const vtName = await hero.evaluate((el) => (el as HTMLElement).style.viewTransitionName);
    expect(vtName).toMatch(/^proto-/);
  });

  test('rail marks the current panel as active when scrolled', async ({ page, isMobile }) => {
    test.skip(isMobile, 'rail is display:none on mobile');
    await page.goto('');
    const panels = page.locator('.panel[data-sprint-slug]');
    const secondSlug = await panels.nth(1).getAttribute('data-sprint-slug');
    const stream = page.locator('.stream');
    await stream.evaluate((el) => { el.scrollTop = el.clientHeight; });
    await page.waitForTimeout(600);
    const activeNode = page.locator('.rail [data-sprint-target].active');
    const activeSlug = await activeNode.getAttribute('data-sprint-target');
    expect(activeSlug).toBe(secondSlug);
  });
});
