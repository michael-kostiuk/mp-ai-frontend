import { test, expect, setupBackend, generateTestRecipe, createRecipeViaApi } from './fixtures/testFixtures';

test.describe('Recipe Management - CRUD Operations', () => {
  let initialRecipeCount: number;

  test.beforeEach(async ({ page, recipesPage }) => {
    await setupBackend(page);
    await recipesPage.goto();
    initialRecipeCount = await recipesPage.getRecipeCount();
  });

  test('should display recipes list', async ({ recipesPage }) => {
    const currentCount = await recipesPage.getRecipeCount();
    expect(currentCount).toBeGreaterThanOrEqual(0);
  });

  test('should create a new recipe via API and view in UI', async ({ recipesPage, page, resourceTracker }) => {
    const testRecipe = generateTestRecipe();
    const created = await createRecipeViaApi(testRecipe);
    resourceTracker.track('recipes', created.id);

    await recipesPage.goto();
    const recipeCard = page.locator('[data-testid="recipe-card"]').filter({ hasText: testRecipe.name });
    await expect(recipeCard).toBeVisible({ timeout: 10000 });

    const newCount = await recipesPage.getRecipeCount();
    expect(newCount).toBeGreaterThanOrEqual(initialRecipeCount + 1);
  });

  test('should view recipe details', async ({ recipesPage, page, resourceTracker }) => {
    const testRecipe = generateTestRecipe();
    const created = await createRecipeViaApi(testRecipe);
    resourceTracker.track('recipes', created.id);

    await recipesPage.goto();
    await recipesPage.openRecipeDetail(testRecipe.name);

    await expect(page.locator('h1, h2').filter({ hasText: testRecipe.name })).toBeVisible();
    await expect(page.locator('text=Instructions')).toBeVisible();
  });

  test('should edit an existing recipe', async ({ recipesPage, page, resourceTracker }) => {
    const testRecipe = generateTestRecipe();
    const created = await createRecipeViaApi(testRecipe);
    resourceTracker.track('recipes', created.id);
    const updatedName = `${testRecipe.name}_Updated`;

    await recipesPage.goto();
    await recipesPage.openRecipeDetail(testRecipe.name);
    await recipesPage.clickEditButton();

    await page.getByLabel('Recipe Name').fill(updatedName);
    await page.click('button[type="submit"]');

    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible({ timeout: 10000 });
    await recipesPage.goto();

    const isOriginalVisible = await recipesPage.isRecipeVisible(testRecipe.name);
    const isUpdatedVisible = await recipesPage.isRecipeVisible(updatedName);
    expect(isOriginalVisible).toBeFalsy();
    expect(isUpdatedVisible).toBeTruthy();
  });

  test('should delete a recipe', async ({ recipesPage, page, resourceTracker }) => {
    const testRecipe = generateTestRecipe();
    const created = await createRecipeViaApi(testRecipe);
    resourceTracker.track('recipes', created.id);

    await recipesPage.goto();
    const afterCreateCount = await recipesPage.getRecipeCount();
    expect(afterCreateCount).toBeGreaterThanOrEqual(initialRecipeCount + 1);

    await recipesPage.openRecipeDetail(testRecipe.name);
    await recipesPage.clickDeleteButton();
    await recipesPage.confirmDelete();

    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible({ timeout: 10000 });
    await recipesPage.goto();

    const afterDeleteCount = await recipesPage.getRecipeCount();
    expect(afterDeleteCount).toBe(initialRecipeCount);

    const isRecipeVisible = await recipesPage.isRecipeVisible(testRecipe.name);
    expect(isRecipeVisible).toBeFalsy();
  });

  test('should search for recipes', async ({ recipesPage, page, resourceTracker }) => {
    const testRecipe = generateTestRecipe();
    const created = await createRecipeViaApi(testRecipe);
    resourceTracker.track('recipes', created.id);

    await recipesPage.goto();
    await recipesPage.searchRecipes(testRecipe.name);

    const searchResultsCount = await recipesPage.getRecipeCount();
    expect(searchResultsCount).toBeGreaterThanOrEqual(1);
    await expect(page.locator('[data-testid="recipe-card"]').filter({ hasText: testRecipe.name })).toBeVisible();

    await recipesPage.searchRecipes('NonexistentRecipeXYZ123');
    await expect(page.locator('text=No recipes found matching your criteria.')).toBeVisible();

    await recipesPage.searchRecipes('');
    const resetCount = await recipesPage.getRecipeCount();
    expect(resetCount).toBeGreaterThanOrEqual(initialRecipeCount + 1);
  });

  test('should validate required recipe fields', async ({ recipesPage, page }) => {
    await recipesPage.clickAddRecipe();
    await page.click('button[type="submit"]');

    const nameError = await page.isVisible('text=Name is required');
    expect(nameError).toBeTruthy();

    await recipesPage.fillInput(recipesPage.nameInput, 'Test Recipe');
    await page.click('button[type="submit"]');

    const otherErrors = await page.isVisible('text=required');
    expect(otherErrors).toBeTruthy();
  });
});
