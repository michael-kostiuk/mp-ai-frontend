import { test, expect, setupBackend, generateTestIngredient, deleteResource, BACKEND_URL, createIngredientViaApi } from './fixtures/testFixtures';

test.describe('Ingredient Management - CRUD Operations', () => {
  let ingredientId: number | null = null;
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

  test('should create a new ingredient via API and view in UI', async ({ ingredientsPage, page }) => {
    const testIngredient = generateTestIngredient();
    const created = await createIngredientViaApi(testIngredient);
    ingredientId = created.id;
    const ingredientName = testIngredient.name;

    await ingredientsPage.goto();
    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();

    const newCount = await ingredientsPage.getIngredientCount();
    expect(newCount).toBeGreaterThanOrEqual(initialIngredientCount + 1);

    const isIngredientVisible = await ingredientsPage.isIngredientVisible(ingredientName);
    expect(isIngredientVisible).toBeTruthy();
  });

  test('should search for ingredients', async ({ ingredientsPage, page }) => {
    const testIngredient = generateTestIngredient();
    const created = await createIngredientViaApi(testIngredient);
    ingredientId = created.id;
    const ingredientName = testIngredient.name;

    await ingredientsPage.goto();
    await ingredientsPage.searchIngredients(ingredientName);

    const searchResultsCount = await ingredientsPage.getIngredientCount();
    expect(searchResultsCount).toBeGreaterThanOrEqual(1);
    expect(await ingredientsPage.isIngredientVisible(ingredientName)).toBeTruthy();

    await ingredientsPage.searchIngredients('NonexistentIngredientXYZ123');

    const noResultsText = await page.isVisible('text=No ingredients found');
    expect(noResultsText).toBeTruthy();
  });

  test('should view ingredient details', async ({ ingredientsPage, page }) => {
    const testIngredient = generateTestIngredient();
    const created = await createIngredientViaApi(testIngredient);
    ingredientId = created.id;
    const ingredientName = testIngredient.name;

    await ingredientsPage.goto();
    const ingredientRow = page.locator(`tr:has-text("${ingredientName}")`);
    await expect(ingredientRow).toBeVisible();

    const nameCell = ingredientRow.locator('td').nth(0);
    await expect(nameCell).toContainText(ingredientName);

    const categoryCell = ingredientRow.locator('td').nth(1);
    await expect(categoryCell).toContainText(testIngredient.category);

    const caloriesCell = ingredientRow.locator('td').nth(2);
    await expect(caloriesCell).toContainText(testIngredient.calories.toString());
  });

  test('should delete an ingredient', async ({ ingredientsPage, page }) => {
    const testIngredient = generateTestIngredient();
    const created = await createIngredientViaApi(testIngredient);
    ingredientId = created.id;
    const ingredientName = testIngredient.name;

    await ingredientsPage.goto();
    const afterCreateCount = await ingredientsPage.getIngredientCount();
    expect(afterCreateCount).toBeGreaterThanOrEqual(initialIngredientCount + 1);

    await page.click(`tr:has-text("${ingredientName}") button:has-text("Delete")`);
    await page.click('button:has-text("Confirm"), button:has-text("Delete")');

    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible({ timeout: 10000 });
    await ingredientsPage.goto();

    const afterDeleteCount = await ingredientsPage.getIngredientCount();
    expect(afterDeleteCount).toBe(initialIngredientCount);

    const isIngredientVisible = await ingredientsPage.isIngredientVisible(ingredientName);
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

  test.afterEach(async ({ page, ingredientsPage }) => {
    if (ingredientId) {
      try {
        await deleteResource(`${BACKEND_URL}/ingredients/${ingredientId}`);
      } catch (e) {
        console.log('Failed to cleanup ingredient:', e);
      }
      ingredientId = null;
    }
  });
});
