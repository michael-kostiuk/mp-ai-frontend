import { test, expect, setupBackend } from './fixtures/testFixtures';

test.describe('Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupBackend(page);
  });

  test.describe('Recipe Form Validation', () => {
    test('should disable submit when required fields are empty', async ({ page, recipesPage }) => {
      await recipesPage.goto();
      await recipesPage.clickAddRecipe();

      // Submit button should be disabled when form is incomplete
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();
    });

    test('should keep submit disabled with empty name', async ({ page, recipesPage }) => {
      await recipesPage.goto();
      await recipesPage.clickAddRecipe();

      // Fill instructions but leave name empty
      await page.locator('textarea').first().fill('Test instructions');
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();
    });

    test('should close modal on cancel', async ({ page, recipesPage }) => {
      await recipesPage.goto();
      await recipesPage.clickAddRecipe();

      await page.getByLabel('Recipe Name').fill('Test Recipe');
      await page.click('button:has-text("Cancel")');

      await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
    });
  });

  test.describe('Ingredient Form Validation', () => {
    test('should disable submit when name is empty', async ({ page, ingredientsPage }) => {
      await ingredientsPage.goto();
      await ingredientsPage.clickAddIngredient();

      // Submit button should be disabled when name is empty
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();
    });

    test('should enable submit when name is filled', async ({ page, ingredientsPage }) => {
      await ingredientsPage.goto();
      await ingredientsPage.clickAddIngredient();

      await page.getByLabel('Ingredient Name').fill('Test Ingredient');
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled();
    });

    test('should close modal on cancel', async ({ page, ingredientsPage }) => {
      await ingredientsPage.goto();
      await ingredientsPage.clickAddIngredient();

      await page.getByLabel('Ingredient Name').fill('Test Ingredient');
      await page.click('button:has-text("Cancel")');

      await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
    });

    test('should allow typing numeric values without leading zero issue', async ({ page, ingredientsPage }) => {
      await ingredientsPage.goto();
      await ingredientsPage.clickAddIngredient();

      const caloriesInput = page.getByLabel('Calories');
      
      // Initially should be empty (not showing "0")
      await expect(caloriesInput).toHaveValue('');
      
      // Clear and type a new value - should NOT produce "0100"
      await caloriesInput.click();
      await caloriesInput.fill('');
      await caloriesInput.type('100');
      
      // Value should be exactly "100", not "0100"
      await expect(caloriesInput).toHaveValue('100');
      
      // Clear and type another value
      await caloriesInput.fill('');
      await caloriesInput.type('50');
      await expect(caloriesInput).toHaveValue('50');
      
      // Cancel modal
      await page.click('button:has-text("Cancel")');
    });
  });

  test.describe('Meal Plan Form Validation', () => {
    test('should show form with default values', async ({ page, mealPlansPage }) => {
      await mealPlansPage.goto();
      await mealPlansPage.clickAddMealPlan();

      // Form should be visible with default values
      await expect(page.getByLabel('Start Date')).toBeVisible();
      await expect(page.getByLabel('People Count')).toBeVisible();
      await expect(page.getByLabel('Target Calories per Day')).toBeVisible();
    });

    test('should close modal on cancel', async ({ page, mealPlansPage }) => {
      await mealPlansPage.goto();
      await mealPlansPage.clickAddMealPlan();

      await page.click('button:has-text("Cancel")');

      await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
    });
  });
});
