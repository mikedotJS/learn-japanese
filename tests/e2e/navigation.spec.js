import { test, expect } from '@playwright/test';
import { mockBasedHappyPath, seedSignedInSession } from './fixtures/mockBased.js';

test.describe('navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockBasedHappyPath(page);
    await seedSignedInSession(page);
    page.on('pageerror', (err) => {
      throw new Error(`uncaught page error: ${err.message}`);
    });
  });

  test('main sections render without crashing', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Apprenez le japonais du N5 au N1', { exact: false })).toBeVisible();

    // Curriculum
    await page.getByRole('link', { name: /Voir le parcours/ }).click();
    await expect(page).toHaveURL(/#\/curriculum$/);
    await expect(page.getByRole('heading', { name: 'Votre parcours' })).toBeVisible();

    // Kana
    await page.goto('/#/kana');
    await expect(page.locator('.main-content')).toBeVisible();

    // Vocabulary
    await page.goto('/#/vocabulary');
    await expect(page.locator('.main-content')).toBeVisible();

    // Kanji
    await page.goto('/#/kanji');
    await expect(page.locator('.main-content')).toBeVisible();

    // Grammar
    await page.goto('/#/grammar');
    await expect(page.locator('.main-content')).toBeVisible();

    // Quiz
    await page.goto('/#/quiz');
    await expect(page.locator('.main-content')).toBeVisible();

    // Progress
    await page.goto('/#/progress');
    await expect(page.locator('.main-content')).toBeVisible();

    // Achievements
    await page.goto('/#/achievements');
    await expect(page.locator('.main-content')).toBeVisible();
  });

  test('first lesson StudySession page mounts', async ({ page }) => {
    await page.goto('/#/curriculum');
    const firstLesson = page.locator('.curriculum-lesson').first();
    await expect(firstLesson).toBeVisible();
    await firstLesson.click();
    await expect(page).toHaveURL(/#\/study\//);
    await expect(page.locator('.main-content')).toBeVisible();
  });
});
