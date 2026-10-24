import { Page } from '@playwright/test';
import { test, expect, setupBackend, generateTestRecipe } from './fixtures/testFixtures';
import { BACKEND_URL, createRecipeViaApi } from './utils/testHelpers';

// Holds matching backend responses until release() is called
const holdResponses = async (page: Page, url: string) => {
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(url, async (route) => {
    await released;
    await route.continue().catch(() => undefined);
  });
  return release;
};

const cachedKeys = (page: Page) =>
  page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('mp-cache:')));

test.describe('Client cache', () => {
  test.beforeEach(async ({ page }) => {
    await setupBackend(page);
  });

  test('a recipe seen once renders without waiting for the server', async ({ page, resourceTracker }) => {
    const recipe = await createRecipeViaApi(generateTestRecipe());
    resourceTracker.track('recipes', recipe.id);

    await page.goto(`/recipes/${recipe.id}`);
    await expect(page.getByText(recipe.name).first()).toBeVisible();

    const release = await holdResponses(page, `${BACKEND_URL}/recipes/${recipe.id}`);
    await page.reload();
    await expect(page.getByText(recipe.name).first()).toBeVisible({ timeout: 3000 });
    release();
  });

  test('a meal plan list seen once renders without waiting for the server', async ({ page }) => {
    await page.goto('/meal-plans');
    const firstCard = page.locator('[data-testid="meal-plan-card"]').first();
    await expect(firstCard).toBeVisible();

    const release = await holdResponses(page, `${BACKEND_URL}/meal-plans/`);
    await page.reload();
    await expect(page.locator('[data-testid="meal-plan-card"]').first()).toBeVisible({ timeout: 3000 });
    release();
  });

  test('a server-side change replaces the cached copy in the background', async ({ page, resourceTracker }) => {
    const recipe = await createRecipeViaApi(generateTestRecipe());
    resourceTracker.track('recipes', recipe.id);

    await page.goto(`/recipes/${recipe.id}`);
    await expect(page.getByText(recipe.name).first()).toBeVisible();

    const renamed = `${recipe.name} renamed`;
    const response = await fetch(`${BACKEND_URL}/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...generateTestRecipe(), name: renamed })
    });
    expect(response.ok).toBe(true);

    await page.reload();
    await expect(page.getByText(renamed).first()).toBeVisible();
  });

  test('an edit in the app drops the cache and shows the server version', async ({ page, resourceTracker }) => {
    const recipe = await createRecipeViaApi(generateTestRecipe());
    resourceTracker.track('recipes', recipe.id);

    await page.goto(`/recipes/${recipe.id}`);
    await expect(page.getByText(recipe.name).first()).toBeVisible();
    expect(await cachedKeys(page)).toContain(`mp-cache:v1:recipe:[${recipe.id}]`);

    await page.click('button:has-text("Delete Recipe")');
    await page.click('button:has-text("Confirm Delete")');
    resourceTracker.markCleaned('recipes', recipe.id);

    await expect.poll(() => cachedKeys(page)).not.toContain(`mp-cache:v1:recipe:[${recipe.id}]`);
    await page.goto('/recipes');
    await expect(page.locator('[data-testid="recipe-card"]').first()).toBeVisible();
    await expect(page.getByText(recipe.name)).toHaveCount(0);
  });
});
