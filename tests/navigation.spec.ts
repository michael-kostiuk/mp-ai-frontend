import { test, expect } from './fixtures/test-setup';

test.describe('Navigation & Basic Functionality', () => {
  test('Navigation between pages', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'MealMaster' })).toBeVisible();

    await page.getByRole('link', { name: 'Recipes', exact: true }).click();
    await expect(page).toHaveURL(/\/recipes/);
    await expect(page.getByRole('heading', { name: 'Recipes' }).first()).toBeVisible();

    await page.getByRole('link', { name: 'Meal Plans' }).click();
    await expect(page).toHaveURL(/\/meal-plans/);
    await expect(page.getByRole('heading', { name: 'Meal Plans' }).first()).toBeVisible({ timeout: 15000 });

    await page.getByRole('link', { name: 'Shopping Lists' }).click();
    await expect(page).toHaveURL(/\/shopping-lists/);
    await expect(page.getByRole('heading', { name: 'Shopping Lists' }).first()).toBeVisible({ timeout: 15000 });

    await page.getByRole('link', { name: 'Ingredients' }).click();
    await expect(page).toHaveURL(/\/ingredients/);
    await expect(page.getByRole('heading', { name: 'Ingredients' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('Backend config is injected into localStorage', async ({ page }) => {
    await page.goto('/');
    const stored = await page.evaluate(() => window.localStorage.getItem('apiConfig'));
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored as string) as { baseUrl?: string };
    expect(parsed.baseUrl).toBe(process.env.BACKEND_URL || 'http://be:8000');
  });

  test('API configuration panel opens and cancels', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('API Configuration')).toBeVisible();

    await page.getByRole('button', { name: 'Edit Configuration' }).click();
    await expect(page.getByLabel('API Base URL')).toBeVisible();
    await expect(page.getByLabel('Request Timeout (ms)')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});
