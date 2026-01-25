import { test, expect, setupBackend, generateTestRecipe, createRecipeViaApi, generateTestMealPlan, createMealPlanViaApi, generateTestIngredient, createIngredientViaApi } from './fixtures/testFixtures';

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

    // Navigate back to home via logo (MealMaster link)
    await page.click('a:has-text("MealMaster")');
    await expect(page).toHaveURL(/\/$/);
  });

  test('should navigate to recipe detail page', async ({ page, recipesPage, resourceTracker }) => {
    const recipe = generateTestRecipe();
    const created = await createRecipeViaApi(recipe);
    resourceTracker.track('recipes', created.id);

    await recipesPage.goto();
    await recipesPage.openRecipeDetail(recipe.name);
    await expect(page.locator('div.fixed.inset-0')).toBeVisible();
  });

  test('should navigate to meal plan detail page', async ({ page, mealPlansPage, resourceTracker }) => {
    const mealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(mealPlan);
    resourceTracker.track('meal-plans', created.id);

    await mealPlansPage.goto();
    await mealPlansPage.openMealPlanDetail(mealPlan.dietary_preferences[0]);
    await expect(page.locator('div.fixed.inset-0')).toBeVisible();
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

  test('should filter recipes by name', async ({ page, recipesPage, resourceTracker }) => {
    const recipe = generateTestRecipe();
    const created = await createRecipeViaApi(recipe);
    resourceTracker.track('recipes', created.id);

    await recipesPage.goto();
    const initialCount = await recipesPage.getRecipeCount();

    await recipesPage.searchRecipes(recipe.name);

    const filteredCount = await recipesPage.getRecipeCount();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    await expect(page.locator('[data-testid="recipe-card"]').filter({ hasText: recipe.name })).toBeVisible();
  });

  test('should filter ingredients by name or category', async ({ page, ingredientsPage, resourceTracker }) => {
    const ingredient = generateTestIngredient();
    const created = await createIngredientViaApi(ingredient);
    resourceTracker.track('ingredients', created.id);

    await ingredientsPage.goto();
    const initialCount = await ingredientsPage.getIngredientCount();

    await ingredientsPage.searchIngredients(ingredient.name);

    const filteredCount = await ingredientsPage.getIngredientCount();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    await expect(page.locator('tr').filter({ hasText: ingredient.name })).toBeVisible();
  });

  test('should clear search and show all results', async ({ page, recipesPage, resourceTracker }) => {
    const recipe = generateTestRecipe();
    const created = await createRecipeViaApi(recipe);
    resourceTracker.track('recipes', created.id);

    await recipesPage.goto();
    const totalBeforeFilter = await recipesPage.getRecipeCount();
    await expect(page.locator('[data-testid="recipe-card"]').filter({ hasText: recipe.name })).toBeVisible();

    // Search for non-existent recipe
    await recipesPage.searchRecipes('NonexistentRecipe123');
    await page.waitForTimeout(500);
    await expect(page.locator('text=No recipes found matching your criteria.')).toBeVisible();
    const emptyCount = await recipesPage.getRecipeCount();
    expect(emptyCount).toBe(0);

    // Clear search by reloading the page (more reliable than clearing input)
    await recipesPage.goto();
    const afterClearCount = await recipesPage.getRecipeCount();
    expect(afterClearCount).toBe(totalBeforeFilter);
  });
});
