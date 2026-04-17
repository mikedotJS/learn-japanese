import { test, expect } from '@playwright/test';

// Optional smoke against the real Based instance. Only runs when
// E2E_BASED_EMAIL and E2E_BASED_PASSWORD are set. In CI these are wired to
// dedicated test-account secrets; locally, export them in your shell.

const email = process.env.E2E_BASED_EMAIL;
const password = process.env.E2E_BASED_PASSWORD;
const realBasedUrl = process.env.E2E_BASED_URL;
const realAnonKey = process.env.E2E_BASED_ANON_KEY;

test.describe('smoke: real Based backend', () => {
  test.skip(
    !email || !password || !realBasedUrl || !realAnonKey,
    'Set E2E_BASED_EMAIL / E2E_BASED_PASSWORD / E2E_BASED_URL / E2E_BASED_ANON_KEY to run.',
  );

  test('real sign-in reaches Home', async ({ page }) => {
    // Override the built-in (test.invalid) env vars for this spec by rewriting
    // the preview server's config at fetch time: intercept the Based URL baked
    // into the bundle and forward to the real one.
    const testUrl = 'https://based.test.invalid';
    await page.route(`${testUrl}/**`, async (route) => {
      const req = route.request();
      const targetUrl = req.url().replace(testUrl, realBasedUrl.replace(/\/$/, ''));
      const headers = { ...req.headers() };
      if (headers['apikey'] === 'test-anon-key') headers['apikey'] = realAnonKey;
      const res = await page.request.fetch(targetUrl, {
        method: req.method(),
        headers,
        data: req.postData() ?? undefined,
      });
      const body = await res.body();
      return route.fulfill({
        status: res.status(),
        headers: res.headers(),
        body,
      });
    });

    await page.goto('/');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Mot de passe').fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText('Apprenez le japonais du N5 au N1', { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });
});
