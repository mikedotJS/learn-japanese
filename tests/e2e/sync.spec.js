import { test, expect } from '@playwright/test';
import { mockBasedHappyPath, seedSignedInSession } from './fixtures/mockBased.js';

test.describe('cross-device sync', () => {
  test('first-time mutation creates the user_data row on the server', async ({ page }) => {
    const mock = await mockBasedHappyPath(page);
    await seedSignedInSession(page);
    await page.goto('/');

    // Hydration must complete first; Home's hero confirms the app is past auth.
    await expect(page.getByText('Apprenez le japonais', { exact: false })).toBeVisible();

    // Trigger a persistable state change — the navbar level select writes
    // into nihongo-progress via setCurrentLevel.
    await page.locator('.navbar-level select').selectOption('N3');

    // Past the 500ms debounce + a margin.
    await page.waitForTimeout(1200);

    const creates = mock.getWrites().filter((w) => w.op === 'create');
    const progressWrite = creates.find((w) => w.id.endsWith('nihongo-progress'));
    expect(progressWrite, 'expected a POST create for the progress row').toBeTruthy();
    const data = JSON.parse(progressWrite.data);
    expect(data.settings.currentLevel).toBe('N3');
  });

  test('subsequent mutations update the existing row', async ({ page }) => {
    const mock = await mockBasedHappyPath(page);
    await seedSignedInSession(page);
    await page.goto('/');

    await expect(page.getByText('Apprenez le japonais', { exact: false })).toBeVisible();

    await page.locator('.navbar-level select').selectOption('N3');
    await page.waitForTimeout(1200);
    await page.locator('.navbar-level select').selectOption('N2');
    await page.waitForTimeout(1200);

    const progressWrites = mock.getWrites().filter((w) => w.id.endsWith('nihongo-progress'));
    expect(progressWrites.length).toBeGreaterThanOrEqual(2);
    expect(progressWrites[0].op).toBe('create');
    expect(progressWrites[progressWrites.length - 1].op).toBe('update');
    const last = JSON.parse(progressWrites[progressWrites.length - 1].data);
    expect(last.settings.currentLevel).toBe('N2');
  });
});
