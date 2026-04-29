/**
 * Smoke E2E suite (issue #15) — proves the app boots and the public surfaces
 * render without runtime errors. Heavier flows (chat-to-workflow, deploy,
 * billing) live in dedicated specs that mock provider responses.
 */

import { test, expect } from '@playwright/test';

test.describe('public surfaces render', () => {
  test('login page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    // The Login page is the entry point; assert *something* visible.
    await expect(page.locator('body')).toBeVisible();
    expect(errors, errors.join('\n')).toEqual([]);
  });

  for (const path of ['/pricing', '/use-cases', '/support', '/product', '/learn', '/welcome']) {
    test(`marketing route ${path} loads without runtime errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(path));
      await expect(page.locator('body')).toBeVisible();
      // Console errors that block render are caught above; we tolerate
      // network 4xx/5xx from optional integrations.
      expect(errors, `Runtime errors on ${path}:\n${errors.join('\n')}`).toEqual([]);
    });
  }
});

test.describe('onboarding wizard', () => {
  test('user can step from welcome to task selection', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.getByRole('heading', { name: /first automation/i })).toBeVisible();
    await page.getByRole('button', { name: /let's go/i }).click();
    await expect(page.getByRole('heading', { name: /repetitive task/i })).toBeVisible();
  });
});
