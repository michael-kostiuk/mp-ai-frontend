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

  test('should open edit modal for existing recipe', async ({ recipesPage, page, resourceTracker }) => {
    const testRecipe = generateTestRecipe();
    const created = await createRecipeViaApi(testRecipe);
    resourceTracker.track('recipes', created.id);

    await recipesPage.goto();
    await recipesPage.openRecipeDetail(testRecipe.name);
    await recipesPage.clickEditButton();

    // Verify edit modal opens with correct title and pre-filled name
    await expect(page.locator('h2:has-text("Edit Recipe")')).toBeVisible();
    await expect(page.getByLabel('Recipe Name')).toHaveValue(testRecipe.name);
    
    // Close modal
    await page.click('button:has-text("Cancel")');
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
    
    // Search for the created recipe
    await recipesPage.searchRecipes(testRecipe.name);
    await page.waitForTimeout(500); // Wait for filter to apply

    const searchResultsCount = await recipesPage.getRecipeCount();
    expect(searchResultsCount).toBeGreaterThanOrEqual(1);
    await expect(page.locator('[data-testid="recipe-card"]').filter({ hasText: testRecipe.name })).toBeVisible();

    // Search for non-existent recipe
    await recipesPage.searchRecipes('NonexistentRecipeXYZ123');
    await page.waitForTimeout(500);
    await expect(page.locator('text=No recipes found matching your criteria.')).toBeVisible();
  });

  test('should validate required recipe fields', async ({ recipesPage, page }) => {
    await recipesPage.clickAddRecipe();
    
    // Modal should be visible
    await expect(page.locator('h2:has-text("Create New Recipe")')).toBeVisible();
    
    // Submit button should be disabled when form is incomplete
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();

    // Fill in the name field
    await page.getByLabel('Recipe Name').fill('Test Recipe');
    
    // Submit should still be disabled (needs instructions AND at least one ingredient)
    await expect(submitButton).toBeDisabled();
    
    // Fill instructions
    await page.locator('textarea').first().fill('Test instructions');
    
    // Still disabled because no ingredients added
    await expect(submitButton).toBeDisabled();
    
    // Cancel to close modal
    await page.click('button:has-text("Cancel")');
  });
});
