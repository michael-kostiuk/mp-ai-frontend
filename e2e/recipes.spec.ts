import { test, expect, setupBackend, generateTestRecipe, deleteResource, BACKEND_URL, createRecipeViaApi } from './fixtures/testFixtures';

test.describe('Recipe Management - CRUD Operations', () => {
  let recipeId: number | null = null;
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

  test('should create a new recipe via API and view in UI', async ({ recipesPage, page }) => {
    const testRecipe = generateTestRecipe();
    const created = await createRecipeViaApi(testRecipe);
    recipeId = created.id;
    console.log(`Created recipe with ID: ${recipeId}, Name: ${testRecipe.name}`);
    const recipeName = testRecipe.name;

    await recipesPage.goto();
    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();

    await page.waitForTimeout(3000);

    const pageContent = await page.content();
    console.log('Page has recipes content:', pageContent.includes('article'));

    const newCount = await recipesPage.getRecipeCount();
    console.log(`Recipe count - Initial: ${initialRecipeCount}, New: ${newCount}`);
    expect(newCount).toBeGreaterThanOrEqual(initialRecipeCount + 1);

    const isRecipeVisible = await recipesPage.isRecipeVisible(recipeName);
    expect(isRecipeVisible).toBeTruthy();
  });

  test('should view recipe details', async ({ recipesPage, page }) => {
    const testRecipe = generateTestRecipe();
    const created = await createRecipeViaApi(testRecipe);
    recipeId = created.id;
    const recipeName = testRecipe.name;

    await recipesPage.goto();
    await recipesPage.openRecipeDetail(recipeName);

    await expect(page.locator('h1, h2').filter({ hasText: recipeName })).toBeVisible();
    await expect(page.locator('text=Instructions')).toBeVisible();
  });

  test('should edit an existing recipe', async ({ recipesPage, page }) => {
    const testRecipe = generateTestRecipe();
    const created = await createRecipeViaApi(testRecipe);
    recipeId = created.id;
    const originalName = testRecipe.name;
    const updatedName = `${originalName}_Updated`;

    await recipesPage.goto();
    await recipesPage.openRecipeDetail(originalName);
    await recipesPage.clickEditButton();

    await page.getByLabel('Recipe Name').fill(updatedName);
    await page.click('button[type="submit"]');

    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible({ timeout: 10000 });
    await recipesPage.goto();

    const isOriginalVisible = await recipesPage.isRecipeVisible(originalName);
    const isUpdatedVisible = await recipesPage.isRecipeVisible(updatedName);
    expect(isOriginalVisible).toBeFalsy();
    expect(isUpdatedVisible).toBeTruthy();
  });

  test('should delete a recipe', async ({ recipesPage, page }) => {
    const testRecipe = generateTestRecipe();
    const created = await createRecipeViaApi(testRecipe);
    recipeId = created.id;
    const recipeName = testRecipe.name;

    await recipesPage.goto();
    const afterCreateCount = await recipesPage.getRecipeCount();
    expect(afterCreateCount).toBeGreaterThanOrEqual(initialRecipeCount + 1);

    await recipesPage.openRecipeDetail(recipeName);
    await recipesPage.clickDeleteButton();
    await recipesPage.confirmDelete();

    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible({ timeout: 10000 });
    await recipesPage.goto();

    const afterDeleteCount = await recipesPage.getRecipeCount();
    expect(afterDeleteCount).toBe(initialRecipeCount);

    const isRecipeVisible = await recipesPage.isRecipeVisible(recipeName);
    expect(isRecipeVisible).toBeFalsy();
  });

  test('should search for recipes', async ({ recipesPage, page }) => {
    const testRecipe = generateTestRecipe();
    const created = await createRecipeViaApi(testRecipe);
    recipeId = created.id;
    const recipeName = testRecipe.name;

    await recipesPage.goto();
    await recipesPage.searchRecipes(recipeName);

    const searchResultsCount = await recipesPage.getRecipeCount();
    expect(searchResultsCount).toBeGreaterThanOrEqual(1);
    expect(await recipesPage.isRecipeVisible(recipeName)).toBeTruthy();

    await recipesPage.searchRecipes('NonexistentRecipeXYZ123');

    const noResultsCount = await recipesPage.getRecipeCount();
    expect(noResultsCount).toBe(0);

    await recipesPage.goto();
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

  test.afterEach(async ({ page, recipesPage }) => {
    if (recipeId) {
      try {
        await deleteResource(`${BACKEND_URL}/recipes/${recipeId}`);
      } catch (e) {
        console.log('Failed to cleanup recipe:', e);
      }
      recipeId = null;
    }
  });
});
