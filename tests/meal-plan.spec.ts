import { test, expect } from './fixtures/test-setup';

test.describe('Meal Plan Management', () => {
  test('Create, edit, and delete meal plan (idempotent)', async ({ page, recipePage, mealPlanPage, createdRecipes, createdMealPlanIds }) => {
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const recipeName = `E2E Meal Plan Recipe ${unique}`;
    createdRecipes.push({ name: recipeName });

    await recipePage.navigate();
    await recipePage.openCreateModal();
    await recipePage.fillRecipeDetails({
      name: recipeName,
      category: 'Dinner',
      servings: '2',
      prepTime: '0',
      cookTime: '0',
      instructions: 'Recipe for meal plan test.'
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

    await mealPlanPage.navigate();
    await expect(page.getByRole('heading', { name: 'Meal Plans' })).toBeVisible();

    await mealPlanPage.startCreatePlan();

    const today = new Date();
    const start = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    await mealPlanPage.fillPlanDetails({
      startDate,
      endDate,
      people: '2',
      calories: '2000'
    });

    await mealPlanPage.addMealToPlan(recipeName);

    const [createResponse] = await Promise.all([
      page.waitForResponse(resp =>
        resp.request().method() === 'POST' &&
        (() => {
          const url = new URL(resp.url());
          return (url.pathname === '/meal-plans' || url.pathname === '/meal-plans/') && resp.status() >= 200 && resp.status() < 300;
        })()
      ),
      mealPlanPage.submitPlan()
    ]);

    const created = await createResponse.json();
    expect(created?.id).toBeTruthy();
    createdMealPlanIds.push(created.id);

    const format = (dateString: string) =>
      new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dateRangeText = `${format(`${startDate}T00:00:00`)} - ${format(`${endDate}T23:59:59`)}`;

    const planCard = page.getByText(dateRangeText).first();
    await expect(planCard).toBeVisible();
    await planCard.click();
    await expect(page.getByRole('heading', { name: 'Meal Plan Details' })).toBeVisible();

    await page.getByRole('button', { name: 'Edit Plan' }).click();
    await expect(page.getByRole('heading', { name: /Edit Meal Plan/i })).toBeVisible();

    await page.getByLabel('Target Calories per Day').fill('2100');
    await Promise.all([
      page.waitForResponse(resp =>
        resp.request().method() === 'PUT' &&
        (() => {
          const url = new URL(resp.url());
          return url.pathname.startsWith(`/meal-plans/${created.id}`) && resp.status() >= 200 && resp.status() < 300;
        })()
      ),
      page.getByRole('button', { name: 'Update Meal Plan' }).click()
    ]);

    await mealPlanPage.deletePlan(created.id, dateRangeText);

    createdMealPlanIds.pop();
    await expect(page).toHaveURL(/\/meal-plans$/);

    await recipePage.navigate();
    await recipePage.deleteRecipe(recipeName);
    createdRecipes.pop();
  });
});
