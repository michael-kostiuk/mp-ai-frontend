import { test as base, Page, expect } from '@playwright/test';
import { RecipesPage } from '../pages/RecipesPage';
import { IngredientsPage } from '../pages/IngredientsPage';
import { MealPlansPage } from '../pages/MealPlansPage';
import { configureBackendUrl, generateUniqueName, waitForApiResponse, createRecipeViaApi, createIngredientViaApi, createMealPlanViaApi, ResourceTracker, BACKEND_URL, deleteIngredientViaMerge } from '../utils/testHelpers';

type TestFixtures = {
  recipesPage: RecipesPage;
  ingredientsPage: IngredientsPage;
  mealPlansPage: MealPlansPage;
  resourceTracker: ResourceTracker;
};

const test = base.extend<TestFixtures>({
  resourceTracker: async ({}, use) => {
    const tracker = new ResourceTracker();
    await use(tracker);
    await tracker.cleanupAll();
  },
  recipesPage: async ({ page }, use) => {
    const recipesPage = new RecipesPage(page);
    await use(recipesPage);
  },
  ingredientsPage: async ({ page }, use) => {
    const ingredientsPage = new IngredientsPage(page);
    await use(ingredientsPage);
  },
  mealPlansPage: async ({ page }, use) => {
    const mealPlansPage = new MealPlansPage(page);
    await use(mealPlansPage);
  },
});

const setupBackend = async (page: Page) => {
  await configureBackendUrl(page);
};

const generateTestRecipe = () => ({
  name: generateUniqueName('E2E Recipe'),
  servings: 4,
  prep_time: 15,
  cook_time: 30,
  instructions: 'Mix all ingredients and cook well',
  category: 'dinner',
  calories: 500,
  protein: 25,
  carbs: 50,
  fats: 20,
  ingredients: [],
  breakfast_weight: 0.2,
  lunch_weight: 0.3,
  dinner_weight: 0.5
});

const generateTestIngredient = () => ({
  name: generateUniqueName('E2E Ingredient'),
  category: 'vegetables',
  base_unit: 'g',
  calories: 50,
  protein: 2,
  carbs: 10,
  fats: 0,
});

const generateTestMealPlan = () => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  return {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    people_count: 2,
    target_calories: 2000,
    dietary_preferences: [generateUniqueName('E2E Preference')],
    entries: []
  };
};

export { test, expect, setupBackend, generateTestRecipe, generateTestIngredient, generateTestMealPlan, createRecipeViaApi, createIngredientViaApi, createMealPlanViaApi, ResourceTracker, BACKEND_URL, deleteIngredientViaMerge };
export type { TestFixtures };
