import { test, expect } from './fixtures/test-setup';

test.describe('Smoke E2E', () => {
  test('Open home and browse to recipes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'MealMaster' })).toBeVisible();

    await page.getByRole('link', { name: 'Recipes', exact: true }).click();
    await expect(page).toHaveURL(/\/recipes/);
    await expect(page.getByRole('heading', { name: 'Recipes' }).first()).toBeVisible();
  });
});
