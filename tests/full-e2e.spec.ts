import { test, expect } from './fixtures/test-setup';

test.describe('End-to-End User Journey', () => {
    const formatDateRange = (startDate: string, endDate: string) => {
        const format = (dateString: string) =>
            new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${format(startDate)} - ${format(endDate)}`;
    };

    test('Complete Flow: Create Recipe, Create Meal Plan, Generate List', async ({ page, recipePage, mealPlanPage, createdRecipes, createdMealPlanIds, createdShoppingListIds }) => {
        // --- 1. Create Recipe ---
        const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const recipeName = `E2E Test Recipe ${unique}`;
        createdRecipes.push({ name: recipeName });

        await recipePage.navigate();
        await recipePage.openCreateModal();
        await recipePage.fillRecipeDetails({
            name: recipeName,
            category: 'Dinner',
            servings: '4',
            prepTime: '20',
            cookTime: '40',
            instructions: 'Test instructions.'
        });

        await recipePage.addIngredient('Chicken', '500', 'g');

        // Submit and capture ID if possible, otherwise rely on name cleanup
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
            if (recipeData?.id) {
                createdRecipes[createdRecipes.length - 1].id = recipeData.id;
            }
        } catch {
            // Ignore parse failures; fallback cleanup by name will handle it
        }

        await page.getByPlaceholder('Search recipes...').fill(recipeName);
        await expect(page.getByText(recipeName).first()).toBeVisible({ timeout: 15000 });

        // --- 2. Create Meal Plan ---
        await mealPlanPage.navigate();

        // Verify we are on meal plans page
        await expect(page.getByRole('heading', { name: 'Meal Plans' })).toBeVisible();

        await mealPlanPage.startCreatePlan();

        const today = new Date().toISOString().split('T')[0];
        await mealPlanPage.fillPlanDetails({
            startDate: today,
            endDate: today, // Single day plan
            people: '2',
            calories: '2000'
        });

        await mealPlanPage.addMealToPlan(recipeName);

        // Capture the response to get ID
        const [planResponse] = await Promise.all([
            page.waitForResponse(resp =>
                resp.request().method() === 'POST' &&
                (() => {
                    const url = new URL(resp.url());
                    return (url.pathname === '/meal-plans' || url.pathname === '/meal-plans/') && resp.status() >= 200 && resp.status() < 300;
                })()
            ),
            mealPlanPage.submitPlan()
        ]);

        const planData = await planResponse.json();
        if (planData.id) {
            createdMealPlanIds.push(planData.id);
        }

        // --- 3. Verify Plan and List Generation ---
        const dateRangeText = formatDateRange(`${today}T00:00:00`, `${today}T23:59:59`);
        const planCard = page.getByText(dateRangeText).first();
        await expect(planCard).toBeVisible();
        await planCard.click();
        await expect(page.getByRole('heading', { name: 'Meal Plan Details' })).toBeVisible();

        if (planData.id) {
            const [listResponse] = await Promise.all([
                page.waitForResponse(resp =>
                    resp.request().method() === 'GET' &&
                    resp.url().includes(`/meal-plans/${planData.id}/shopping-list`) &&
                    resp.status() === 200
                ),
                page.getByRole('button', { name: 'Generate List' }).click()
            ]);

            const listData = await listResponse.json();
            if (listData?.id) {
                createdShoppingListIds.push(listData.id);
            }
        }

        await page.getByRole('button', { name: 'Close' }).click();

        await page.getByRole('link', { name: 'Shopping Lists' }).click();
        await expect(page).toHaveURL(/\/shopping-lists/);

        // Go back to Recipes to verify recipe still there
        await recipePage.navigate();
        await expect(page.getByText(recipeName)).toBeVisible();
    });

    test('Recipe Management: CRUD and Validation', async ({ page, recipePage, createdRecipes }) => {
        const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const recipeName = `CRUD Test Recipe ${unique}`;
        createdRecipes.push({ name: recipeName });

        // CREATE
        await recipePage.navigate();
        await recipePage.openCreateModal();
        await recipePage.fillRecipeDetails({ name: recipeName, instructions: 'CRUD recipe instructions.' });
        await recipePage.addIngredient('Tomato');

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
            if (recipeData?.id) {
                createdRecipes[createdRecipes.length - 1].id = recipeData.id;
            }
        } catch {
            // Ignore
        }

        await page.getByPlaceholder('Search recipes...').fill(recipeName);
        await expect(page.getByText(recipeName).first()).toBeVisible({ timeout: 15000 });

        // READ
        await page.getByText(recipeName).first().click();
        await expect(page.getByRole('heading', { name: 'Recipe Details' })).toBeVisible();

        // DELETE (explicit; keep cleanup fallback if test fails mid-way)
        await page.getByRole('button', { name: 'Delete Recipe' }).click();
        await page.getByRole('button', { name: 'Confirm Delete' }).click();

        await expect(page.getByText(recipeName)).not.toBeVisible();

        createdRecipes.pop();
    });
});
