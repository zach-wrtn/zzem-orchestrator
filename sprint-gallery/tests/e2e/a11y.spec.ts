import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('axe a11y scan', () => {
  const routes = [
    '',
    'sprints/ugc-platform-002/',
    'prototypes/ugc-platform-002/app-001/',
    'system/',
    'system/foundations/color/',
    'system/components/button/',
    'system/patterns/',
  ];

  for (const path of routes) {
    test(`no critical/serious violations on /${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      const critical = results.violations.filter((v) =>
        ['critical', 'serious'].includes(v.impact ?? ''),
      );
      if (critical.length > 0) {
        console.log(JSON.stringify(critical, null, 2));
      }
      expect(critical).toEqual([]);
    });
  }
});
