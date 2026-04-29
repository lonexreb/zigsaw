/**
 * Automated accessibility audit (issue #14).
 *
 * Runs axe-core against every public route and fails on any `serious` or
 * `critical` violation. `moderate` and `minor` violations are reported but
 * do not block — track them as follow-up tickets.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PUBLIC_ROUTES = ['/', '/pricing', '/use-cases', '/support', '/product', '/learn', '/welcome'];

const BLOCKING_IMPACTS = new Set(['serious', 'critical']);

for (const route of PUBLIC_ROUTES) {
  test(`a11y: ${route} has no serious or critical violations`, async ({ page }) => {
    await page.goto(route);
    // Wait for the body to be in DOM. Each page handles its own loading; we
    // don't gate on networkidle because some routes lazy-load images.
    await page.locator('body').waitFor();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter((v) => BLOCKING_IMPACTS.has(v.impact ?? ''));
    if (blocking.length > 0) {
      console.error(`\n[a11y] ${route} blocking violations:`);
      for (const v of blocking) {
        console.error(`  - ${v.id} (${v.impact}): ${v.help}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.error(`      target: ${node.target.join(', ')}`);
        }
      }
    }

    expect(blocking, `Found ${blocking.length} blocking a11y violations on ${route}`).toEqual([]);
  });
}
