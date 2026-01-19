import { test, expect, setupBackend } from './fixtures/testFixtures';

test.describe('Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupBackend(page);
  });

  test.describe('Recipe Form Validation', () => {
    test('should validate required recipe fields', async ({ page, recipesPage }) => {
      await recipesPage.goto();
      await recipesPage.clickAddRecipe();
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=required') ||
                      await page.isVisible('text=Name is required') ||
                      await page.isVisible('text=Servings is required');
      expect(hasError).toBeTruthy();
    });

    test('should validate recipe name is not empty', async ({ page, recipesPage }) => {
      await recipesPage.goto();
      await recipesPage.clickAddRecipe();

      await recipesPage.fillInput(recipesPage.nameInput, ' ');
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=required') ||
                      await page.isVisible('text=Name is required');
      expect(hasError).toBeTruthy();
    });

    test('should validate numeric recipe fields', async ({ page, recipesPage }) => {
      await recipesPage.goto();
      await recipesPage.clickAddRecipe();

      await recipesPage.fillInput(recipesPage.nameInput, 'Test Recipe');
      await recipesPage.fillInput(recipesPage.servingsInput, 'invalid');
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=number') ||
                      await page.isVisible('text=invalid') ||
                      await page.isVisible('text=required');
      expect(hasError).toBeTruthy();
    });

    test('should require positive values for servings', async ({ page, recipesPage }) => {
      await recipesPage.goto();
      await recipesPage.clickAddRecipe();

      await recipesPage.fillInput(recipesPage.nameInput, 'Test Recipe');
      await recipesPage.fillInput(recipesPage.servingsInput, '-5');
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=positive') ||
                      await page.isVisible('text=greater than') ||
                      await page.isVisible('text=invalid');
      expect(hasError).toBeTruthy();
    });

    test('should close modal on cancel', async ({ page, recipesPage }) => {
      await recipesPage.goto();
      await recipesPage.clickAddRecipe();

      await recipesPage.fillInput(recipesPage.nameInput, 'Test Recipe');
      await page.click('button:has-text("Cancel")');

      await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
    });
  });

  test.describe('Ingredient Form Validation', () => {
    test('should validate required ingredient fields', async ({ page, ingredientsPage }) => {
      await ingredientsPage.goto();
      await ingredientsPage.clickAddIngredient();
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=required') ||
                      await page.isVisible('text=Name is required') ||
                      await page.isVisible('text=Category is required');
      expect(hasError).toBeTruthy();
    });

    test('should validate ingredient name is not empty', async ({ page, ingredientsPage }) => {
      await ingredientsPage.goto();
      await ingredientsPage.clickAddIngredient();

      await ingredientsPage.fillInput(ingredientsPage.nameInput, ' ');
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=required') ||
                      await page.isVisible('text=Name is required');
      expect(hasError).toBeTruthy();
    });

    test('should validate numeric ingredient fields', async ({ page, ingredientsPage }) => {
      await ingredientsPage.goto();
      await ingredientsPage.clickAddIngredient();

      await ingredientsPage.fillInput(ingredientsPage.nameInput, 'Test Ingredient');
      await ingredientsPage.fillInput(ingredientsPage.caloriesInput, 'invalid');
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=number') ||
                      await page.isVisible('text=invalid') ||
                      await page.isVisible('text=required');
      expect(hasError).toBeTruthy();
    });

    test('should require positive values for calories', async ({ page, ingredientsPage }) => {
      await ingredientsPage.goto();
      await ingredientsPage.clickAddIngredient();

      await ingredientsPage.fillInput(ingredientsPage.nameInput, 'Test Ingredient');
      await ingredientsPage.fillInput(ingredientsPage.caloriesInput, '-100');
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=positive') ||
                      await page.isVisible('text=greater than') ||
                      await page.isVisible('text=invalid');
      expect(hasError).toBeTruthy();
    });

    test('should close modal on cancel', async ({ page, ingredientsPage }) => {
      await ingredientsPage.goto();
      await ingredientsPage.clickAddIngredient();

      await ingredientsPage.fillInput(ingredientsPage.nameInput, 'Test Ingredient');
      await page.click('button:has-text("Cancel")');

      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });
  });

  test.describe('Meal Plan Form Validation', () => {
    test('should validate required meal plan fields', async ({ page, mealPlansPage }) => {
      await mealPlansPage.goto();
      await mealPlansPage.clickAddMealPlan();
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=required') ||
                      await page.isVisible('text=Start date is required') ||
                      await page.isVisible('text=End date is required');
      expect(hasError).toBeTruthy();
    });

    test('should validate end date is after start date', async ({ page, mealPlansPage }) => {
      await mealPlansPage.goto();
      await mealPlansPage.clickAddMealPlan();

      await mealPlansPage.fillInput(mealPlansPage.startDateInput, '2024-12-31');
      await mealPlansPage.fillInput(mealPlansPage.endDateInput, '2024-01-01');
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=after') ||
                      await page.isVisible('text=must be after') ||
                      await page.isVisible('text=End date is required');
      expect(hasError).toBeTruthy();
    });

    test('should validate numeric meal plan fields', async ({ page, mealPlansPage }) => {
      await mealPlansPage.goto();
      await mealPlansPage.clickAddMealPlan();

      await mealPlansPage.fillInput(mealPlansPage.startDateInput, '2024-01-01');
      await mealPlansPage.fillInput(mealPlansPage.endDateInput, '2024-01-07');
      await mealPlansPage.fillInput(mealPlansPage.peopleCountInput, 'invalid');
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=number') ||
                      await page.isVisible('text=invalid') ||
                      await page.isVisible('text=required');
      expect(hasError).toBeTruthy();
    });

    test('should require positive values for people count', async ({ page, mealPlansPage }) => {
      await mealPlansPage.goto();
      await mealPlansPage.clickAddMealPlan();

      await mealPlansPage.fillInput(mealPlansPage.startDateInput, '2024-01-01');
      await mealPlansPage.fillInput(mealPlansPage.endDateInput, '2024-01-07');
      await mealPlansPage.fillInput(mealPlansPage.peopleCountInput, '0');
      await page.click('button[type="submit"]');

      const hasError = await page.isVisible('text=positive') ||
                      await page.isVisible('text=greater than') ||
                      await page.isVisible('text=invalid');
      expect(hasError).toBeTruthy();
    });

    test('should close modal on cancel', async ({ page, mealPlansPage }) => {
      await mealPlansPage.goto();
      await mealPlansPage.clickAddMealPlan();

      await mealPlansPage.fillInput(mealPlansPage.startDateInput, '2024-01-01');
      await page.click('button:has-text("Cancel")');

      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });
  });
});
