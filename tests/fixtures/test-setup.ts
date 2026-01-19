import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { RecipePage } from '../pages/RecipePage';
import { MealPlanPage } from '../pages/MealPlanPage';

type CreatedRecipeRef = { id?: number; name: string };

type TestFixtures = {
    recipePage: RecipePage;
    mealPlanPage: MealPlanPage;
    createdRecipes: CreatedRecipeRef[];
    createdMealPlanIds: number[];
    createdShoppingListIds: number[];
    createdIngredientNames: string[];
};

export const test = base.extend<TestFixtures>({
    recipePage: async ({ page }, use) => {
        await use(new RecipePage(page));
    },
    mealPlanPage: async ({ page }, use) => {
        await use(new MealPlanPage(page));
    },
    createdRecipes: async ({ }, use) => {
        const recipes: CreatedRecipeRef[] = [];
        await use(recipes);
    },
    createdMealPlanIds: async ({ }, use) => {
        const ids: number[] = [];
        await use(ids);
    },
    createdShoppingListIds: async ({ }, use) => {
        const ids: number[] = [];
        await use(ids);
    },
    createdIngredientNames: async ({ }, use) => {
        const names: string[] = [];
        await use(names);
    },
});

test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log(`BROWSER(${msg.type()}): ${msg.text()}`));

    const backendUrl = process.env.BACKEND_URL || 'http://be:8000';
    if (backendUrl.includes('onrender.com')) {
        throw new Error(`Refusing to run E2E tests against production-like URL: ${backendUrl}`);
    }
    console.log(`TEST SETUP: Using BACKEND_URL=${backendUrl}`);

    await page.addInitScript((url) => {
        console.log('TEST SETUP: Injecting apiConfig with baseUrl:', url);
        window.localStorage.setItem('apiConfig', JSON.stringify({
            baseUrl: url,
            timeout: 10000
        }));
    }, backendUrl);
});

test.afterEach(async ({ request, createdRecipes, createdMealPlanIds, createdShoppingListIds, createdIngredientNames }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://be:8000';
    if (backendUrl.includes('onrender.com')) {
        throw new Error(`Refusing to run E2E tests cleanup against production-like URL: ${backendUrl}`);
    }

    const getKeepIngredientId = async (): Promise<number | null> => {
        try {
            const res = await request.get(`${backendUrl}/ingredients/`, { params: { name: 'Rice' } });
            if (res.ok()) {
                const list = await res.json();
                const exact = Array.isArray(list) ? list.find((i) => i?.name === 'Rice' && typeof i?.id === 'number') : null;
                if (exact?.id) return exact.id;
                const any = Array.isArray(list) ? list.find((i) => typeof i?.id === 'number') : null;
                if (any?.id) return any.id;
            }
        } catch {
            // ignore
        }
        try {
            const res = await request.get(`${backendUrl}/ingredients/`);
            if (res.ok()) {
                const list = await res.json();
                const any = Array.isArray(list) ? list.find((i) => typeof i?.id === 'number') : null;
                if (any?.id) return any.id;
            }
        } catch {
            // ignore
        }
        return null;
    };

    const keepIngredientId = createdIngredientNames.length > 0 ? await getKeepIngredientId() : null;
    if (createdIngredientNames.length > 0 && !keepIngredientId) {
        console.log('Unable to find keep ingredient id for ingredient cleanup.');
    }

    console.log(`Cleaning up ${createdIngredientNames.length} ingredients...`);
    if (keepIngredientId) {
        for (const name of createdIngredientNames) {
            try {
                const res = await request.get(`${backendUrl}/ingredients/`, { params: { name } });
                if (!res.ok()) continue;
                const list = await res.json();
                const matches = Array.isArray(list) ? list.filter((i) => i?.name === name && typeof i?.id === 'number') : [];
                for (const ing of matches) {
                    await request.post(`${backendUrl}/ingredients/merge`, {
                        params: { keep_ingredient_id: keepIngredientId },
                        data: [ing.id]
                    });
                }

                const verify = await request.get(`${backendUrl}/ingredients/`, { params: { name } });
                if (verify.ok()) {
                    const remaining = await verify.json();
                    const stillThere = Array.isArray(remaining) ? remaining.some((i) => i?.name === name) : false;
                    if (stillThere) console.log(`Ingredient still exists after merge: ${name}`);
                }
            } catch (e) {
                console.log(`Failed to cleanup ingredient ${name}:`, e);
            }
        }
    }

    console.log(`Cleaning up ${createdShoppingListIds.length} shopping lists...`);
    for (const id of createdShoppingListIds) {
        try {
            await request.delete(`${backendUrl}/shopping-lists/${id}`);
            const verify = await request.get(`${backendUrl}/shopping-lists/${id}`);
            if (verify.status() !== 404) {
                console.log(`Shopping list still exists after delete: ${id} (status=${verify.status()})`);
            }
        } catch (e) {
            console.log(`Failed to delete shopping list ${id}:`, e);
        }
    }

    console.log(`Cleaning up ${createdMealPlanIds.length} meal plans...`);
    for (const id of createdMealPlanIds) {
        try {
            await request.delete(`${backendUrl}/meal-plans/${id}`);
            const verify = await request.get(`${backendUrl}/meal-plans/${id}`);
            if (verify.status() !== 404) {
                console.log(`Meal plan still exists after delete: ${id} (status=${verify.status()})`);
            }
        } catch (e) {
            console.log(`Failed to delete meal plan ${id}:`, e);
        }
    }

    console.log(`Cleaning up ${createdRecipes.length} recipes...`);

    for (const recipe of createdRecipes) {
        try {
            if (recipe.id) {
                await request.delete(`${backendUrl}/recipes/${recipe.id}`);
                const verify = await request.get(`${backendUrl}/recipes/${recipe.id}`);
                if (verify.status() !== 404) {
                    console.log(`Recipe still exists after delete: ${recipe.name} (${recipe.id}) (status=${verify.status()})`);
                }
                continue;
            }

            const searchRes = await request.get(`${backendUrl}/recipes/`, { params: { name: recipe.name } });
            if (searchRes.ok()) {
                const found = await searchRes.json();
                for (const r of found) {
                    if (r?.name === recipe.name && typeof r?.id === 'number') {
                        const deleteRes = await request.delete(`${backendUrl}/recipes/${r.id}`);
                        if (!deleteRes.ok()) console.log(`Failed to delete recipe: ${recipe.name} (${r.id})`);
                    }
                }
            }
        } catch (e) {
            console.error(`Error cleaning up recipe ${recipe.name}:`, e);
        }
    }
});

export { expect } from '@playwright/test';
