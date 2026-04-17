import { test, expect } from '@playwright/test';
import {
  mockBasedHappyPath,
  mockBasedSignInFailure,
  seedSignedInSession,
} from './fixtures/mockBased.js';

test.describe('authentication', () => {
  test('shows login screen on first visit', async ({ page }) => {
    await mockBasedHappyPath(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '日本語マスター' })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Mot de passe')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('signs in with valid credentials and reaches Home', async ({ page }) => {
    await mockBasedHappyPath(page);
    await page.goto('/');

    await page.getByPlaceholder('Email').fill('e2e@example.com');
    await page.getByPlaceholder('Mot de passe').fill('correct-horse');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Home hero appears once auth resolves
    await expect(page.getByText('Apprenez le japonais du N5 au N1', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: /Voir le parcours/ })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await mockBasedSignInFailure(page);
    await page.goto('/');

    await page.getByPlaceholder('Email').fill('wrong@example.com');
    await page.getByPlaceholder('Mot de passe').fill('nope123');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.locator('.auth-error')).toBeVisible();
    // Still on login
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('persisted session skips the login screen', async ({ page }) => {
    await mockBasedHappyPath(page);
    await seedSignedInSession(page);
    await page.goto('/');

    await expect(page.getByText('Apprenez le japonais du N5 au N1', { exact: false })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toHaveCount(0);
  });

  test('sign out returns to login', async ({ page }) => {
    await mockBasedHappyPath(page);
    await seedSignedInSession(page);
    await page.goto('/');

    await expect(page.getByText('Apprenez le japonais du N5 au N1', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Déconnexion' }).click();

    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('sign up flow reaches Home', async ({ page }) => {
    await mockBasedHappyPath(page);
    await page.goto('/');

    await page.getByRole('button', { name: /Pas de compte/ }).click();
    await page.getByPlaceholder('Email').fill('new@example.com');
    await page.getByPlaceholder('Mot de passe').fill('newpass1');
    await page.getByRole('button', { name: "S'inscrire" }).click();

    await expect(page.getByText('Apprenez le japonais du N5 au N1', { exact: false })).toBeVisible();
  });
});
