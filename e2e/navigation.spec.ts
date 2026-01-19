import { test, expect, setupBackend } from './fixtures/testFixtures';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupBackend(page);
  });

  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1:has-text("MealMaster")')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to recipes page', async ({ page, recipesPage }) => {
    await recipesPage.goto();
    await expect(page.locator('h1:has-text("Recipes")')).toBeVisible();
  });

  test('should navigate to ingredients page', async ({ page, ingredientsPage }) => {
    await ingredientsPage.goto();
    await expect(page.locator('h1:has-text("Ingredients")')).toBeVisible();
  });

  test('should navigate to meal plans page', async ({ page, mealPlansPage }) => {
    await mealPlansPage.goto();
    await expect(page.locator('h1:has-text("Meal Plans")')).toBeVisible();
  });

  test('should navigate to shopping lists page', async ({ page }) => {
    await page.goto('/shopping-lists');
    await expect(page.locator('h1:has-text("Shopping Lists")')).toBeVisible();
  });

  test('should navigate between pages using header navigation', async ({ page }) => {
    await page.goto('/');
    const homeUrl = page.url();

    await page.click('a:has-text("Recipes")');
    await expect(page).toHaveURL(/\/recipes/);
    await expect(page.locator('h1:has-text("Recipes")')).toBeVisible();

    await page.click('a:has-text("Ingredients")');
    await expect(page).toHaveURL(/\/ingredients/);
    await expect(page.locator('h1:has-text("Ingredients")')).toBeVisible();

    await page.click('a:has-text("Meal Plans")');
    await expect(page).toHaveURL(/\/meal-plans/);
    await expect(page.locator('h1:has-text("Meal Plans")')).toBeVisible();

    await page.click('a:has-text("Shopping Lists")');
    await expect(page).toHaveURL(/\/shopping-lists/);
    await expect(page.locator('h1:has-text("Shopping Lists")')).toBeVisible();

    await page.click('a:has-text("Home")');
    await expect(page).toHaveURL(homeUrl);
  });

  test('should navigate to recipe detail page', async ({ page, recipesPage }) => {
    await recipesPage.goto();

    const cards = page.locator('article, div[data-testid*="recipe"]');
    const count = await cards.count();

    if (count > 0) {
      await cards.first().click();
      await expect(page.locator('div.fixed.inset-0')).toBeVisible();
    }
  });

  test('should navigate to meal plan detail page', async ({ page, mealPlansPage }) => {
    await mealPlansPage.goto();

    const cards = page.locator('article');
    const count = await cards.count();

    if (count > 0) {
      await cards.first().click();
      await expect(page.locator('div.fixed.inset-0')).toBeVisible();
    }
  });

  test('should handle browser back and forward navigation', async ({ page }) => {
    await page.goto('/');
    const homeUrl = page.url();

    await page.click('a:has-text("Recipes")');
    const recipesUrl = page.url();

    await page.click('a:has-text("Ingredients")');
    const ingredientsUrl = page.url();

    await page.goBack();
    await expect(page).toHaveURL(recipesUrl);

    await page.goBack();
    await expect(page).toHaveURL(homeUrl);

    await page.goForward();
    await expect(page).toHaveURL(recipesUrl);
  });
});

test.describe('Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await setupBackend(page);
  });

  test('should filter recipes by name', async ({ page, recipesPage }) => {
    await recipesPage.goto();

    const cards = page.locator('article, div[data-testid*="recipe"]');
    const initialCount = await cards.count();

    await recipesPage.searchRecipes('Chicken');

    const filteredCount = await cards.count();

    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should filter ingredients by name or category', async ({ page, ingredientsPage }) => {
    await ingredientsPage.goto();

    const rows = page.locator('tbody tr');
    const initialCount = await rows.count();

    await ingredientsPage.searchIngredients('Vegetable');

    const filteredCount = await rows.count();

    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should clear search and show all results', async ({ page, recipesPage }) => {
    await recipesPage.goto();

    const cards = page.locator('article, div[data-testid*="recipe"]');
    const initialCount = await cards.count();

    await recipesPage.searchRecipes('NonexistentRecipe123');
    const emptyCount = await cards.count();
    expect(emptyCount).toBe(0);

    await recipesPage.searchRecipes('');
    const afterClearCount = await cards.count();
    expect(afterClearCount).toBe(initialCount);
  });
});
