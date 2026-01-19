import { test, expect } from './fixtures/test-setup';

test.describe('Recipe Management', () => {
  test('View recipes page and open details', async ({ page, recipePage, createdRecipes }) => {
    await recipePage.navigate();
    await expect(page.getByRole('heading', { name: 'Recipes' }).first()).toBeVisible();

    const emptyState = page.getByText('No recipes found matching your criteria.');
    const firstRecipeHeading = page.locator('h3').first();

    await expect
      .poll(async () => {
        const emptyVisible = await emptyState.isVisible().catch(() => false);
        const recipeVisible = await firstRecipeHeading.isVisible().catch(() => false);
        return emptyVisible || recipeVisible;
      }, { timeout: 30000 })
      .toBe(true);

    let recipeNameToOpen: string | null = null;
    if (await emptyState.isVisible().catch(() => false)) {
      const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      recipeNameToOpen = `E2E View Recipe ${unique}`;
      createdRecipes.push({ name: recipeNameToOpen });

      await recipePage.openCreateModal();
      await recipePage.fillRecipeDetails({
        name: recipeNameToOpen,
        category: 'Dinner',
        servings: '2',
        prepTime: '0',
        cookTime: '0',
        instructions: 'Recipe created for view test.'
      });
      await recipePage.addIngredient('Rice', '100', 'g');

      const [createRecipeResponse] = await Promise.all([
        page.waitForResponse(resp =>
          resp.request().method() === 'POST' &&
          (() => {
            const url = new URL(resp.url());
            return (url.pathname === '/recipes' || url.pathname === '/recipes/') && resp.status() >= 200 && resp.status() < 300;
          })()
        ),
        recipePage.submitRecipe()
      ]);
      try {
        const recipeData = await createRecipeResponse.json();
        if (recipeData?.id) createdRecipes[createdRecipes.length - 1].id = recipeData.id;
      } catch {
        // ignore
      }
    } else {
      recipeNameToOpen = (await firstRecipeHeading.textContent())?.trim() || null;
    }

    if (!recipeNameToOpen) {
      throw new Error('Unable to find a recipe to open.');
    }

    await page.getByPlaceholder('Search recipes...').fill(recipeNameToOpen);
    await page.waitForTimeout(500);
    await page.getByText(recipeNameToOpen).first().click();
    await expect(page.getByRole('heading', { name: 'Recipe Details' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    if (createdRecipes.length > 0 && createdRecipes[createdRecipes.length - 1].name === recipeNameToOpen) {
      await recipePage.deleteRecipe(recipeNameToOpen);
      createdRecipes.pop();
    }
  });

  test('Create recipe validation (requires ingredients)', async ({ page, recipePage }) => {
    await recipePage.navigate();
    await recipePage.openCreateModal();

    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await recipePage.fillRecipeDetails({
      name: `Validation Recipe ${unique}`,
      servings: '2',
      prepTime: '0',
      cookTime: '0',
      instructions: 'Validation instructions.'
    });

    const createButton = page.locator('form').getByRole('button', { name: 'Create Recipe' });
    await expect(createButton).toBeDisabled();

    await recipePage.addIngredient('Rice', '100', 'g');
    await expect(createButton).toBeEnabled();

    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('Create and delete recipe (idempotent)', async ({ page, recipePage, createdRecipes }) => {
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const recipeName = `E2E Recipe ${unique}`;
    createdRecipes.push({ name: recipeName });

    await recipePage.navigate();
    await recipePage.openCreateModal();
    await recipePage.fillRecipeDetails({
      name: recipeName,
      category: 'Dinner',
      servings: '2',
      prepTime: '10',
      cookTime: '10',
      instructions: 'E2E instructions.'
    });

    await recipePage.addIngredient('Rice', '100', 'g');

    const createButton = page.locator('form').getByRole('button', { name: 'Create Recipe' });
    await expect(createButton).toBeEnabled();

    const [createRecipeResponse] = await Promise.all([
      page.waitForResponse(resp =>
        resp.request().method() === 'POST' &&
        (() => {
          const url = new URL(resp.url());
          return (url.pathname === '/recipes' || url.pathname === '/recipes/') && resp.status() >= 200 && resp.status() < 300;
        })()
      ),
      recipePage.submitRecipe()
    ]);

    if (!createRecipeResponse.ok()) {
      throw new Error(`Create recipe failed: ${createRecipeResponse.status()}`);
    }

    try {
      const recipeData = await createRecipeResponse.json();
      if (recipeData?.id) {
        createdRecipes[createdRecipes.length - 1].id = recipeData.id;
      }
    } catch {
      // Ignore
    }
    await recipePage.deleteRecipe(recipeName);
    createdRecipes.pop();
  });
});
