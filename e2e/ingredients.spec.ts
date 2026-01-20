import { test, expect, setupBackend, generateTestIngredient, createIngredientViaApi, deleteIngredientViaMerge } from './fixtures/testFixtures';

test.describe('Ingredient Management - CRUD Operations', () => {
  let initialIngredientCount: number;

  test.beforeEach(async ({ page, ingredientsPage }) => {
    await setupBackend(page);
    await ingredientsPage.goto();
    initialIngredientCount = await ingredientsPage.getIngredientCount();
  });

  test('should display ingredients list', async ({ ingredientsPage }) => {
    const currentCount = await ingredientsPage.getIngredientCount();
    expect(currentCount).toBeGreaterThanOrEqual(0);
  });

  test('should create a new ingredient via API and view in UI', async ({ ingredientsPage, page, resourceTracker }) => {
    const testIngredient = generateTestIngredient();
    const created = await createIngredientViaApi(testIngredient);
    resourceTracker.track('ingredients', created.id);

    await ingredientsPage.goto();
    const newCount = await ingredientsPage.getIngredientCount();
    expect(newCount).toBeGreaterThanOrEqual(initialIngredientCount + 1);

    const ingredientRow = page.locator('tr').filter({ hasText: testIngredient.name });
    await expect(ingredientRow).toBeVisible({ timeout: 10000 });
  });

  test('should search for ingredients', async ({ ingredientsPage, page, resourceTracker }) => {
    const testIngredient = generateTestIngredient();
    const created = await createIngredientViaApi(testIngredient);
    resourceTracker.track('ingredients', created.id);

    await ingredientsPage.goto();
    await ingredientsPage.searchIngredients(testIngredient.name);

    const searchResultsCount = await ingredientsPage.getIngredientCount();
    expect(searchResultsCount).toBeGreaterThanOrEqual(1);
    await expect(page.locator('tr').filter({ hasText: testIngredient.name })).toBeVisible();

    await ingredientsPage.searchIngredients('NonexistentIngredientXYZ123');
    await expect(page.locator('text=No ingredients found')).toBeVisible();

    await ingredientsPage.searchIngredients('');
    const resetCount = await ingredientsPage.getIngredientCount();
    expect(resetCount).toBeGreaterThanOrEqual(initialIngredientCount + 1);
  });

  test('should view ingredient details', async ({ ingredientsPage, page, resourceTracker }) => {
    const testIngredient = generateTestIngredient();
    const created = await createIngredientViaApi(testIngredient);
    resourceTracker.track('ingredients', created.id);

    await ingredientsPage.goto();
    const ingredientRow = page.locator('tr').filter({ hasText: testIngredient.name });
    await expect(ingredientRow).toBeVisible({ timeout: 10000 });

    const nameCell = ingredientRow.locator('td').nth(0);
    await expect(nameCell).toContainText(testIngredient.name);

    const categoryCell = ingredientRow.locator('td').nth(1);
    await expect(categoryCell).toContainText(testIngredient.category);

    const caloriesCell = ingredientRow.locator('td').nth(2);
    await expect(caloriesCell).toContainText(testIngredient.calories.toString());
  });

  test('should delete an ingredient via merge cleanup', async ({ ingredientsPage, page, resourceTracker }) => {
    const testIngredient = generateTestIngredient();
    const created = await createIngredientViaApi(testIngredient);
    resourceTracker.track('ingredients', created.id);

    await ingredientsPage.goto();
    const afterCreateCount = await ingredientsPage.getIngredientCount();
    expect(afterCreateCount).toBeGreaterThanOrEqual(initialIngredientCount + 1);

    await deleteIngredientViaMerge(created.id);
    resourceTracker.markCleaned('ingredients', created.id);

    await ingredientsPage.goto();
    const afterDeleteCount = await ingredientsPage.getIngredientCount();
    expect(afterDeleteCount).toBe(initialIngredientCount);

    const isIngredientVisible = await ingredientsPage.isIngredientVisible(testIngredient.name);
    expect(isIngredientVisible).toBeFalsy();
  });

  test('should validate required ingredient fields', async ({ ingredientsPage, page }) => {
    await ingredientsPage.clickAddIngredient();
    await page.click('button[type="submit"]');

    const nameError = await page.isVisible('text=Name is required') ||
                      await page.isVisible('text=required');
    expect(nameError).toBeTruthy();

    await ingredientsPage.fillInput(ingredientsPage.nameInput, 'Test Ingredient');
    await page.click('button[type="submit"]');

    const otherErrors = await page.isVisible('text=required');
    expect(otherErrors).toBeTruthy();
  });
});
