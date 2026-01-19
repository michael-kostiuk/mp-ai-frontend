import { test, expect, setupBackend, generateTestMealPlan, deleteResource, BACKEND_URL, createMealPlanViaApi } from './fixtures/testFixtures';

test.describe('Meal Plan Management - CRUD Operations', () => {
  let mealPlanId: number | null = null;
  let initialMealPlanCount: number;

  test.beforeEach(async ({ page, mealPlansPage }) => {
    await setupBackend(page);
    await mealPlansPage.goto();
    initialMealPlanCount = await mealPlansPage.getMealPlanCount();
  });

  test('should display meal plans list', async ({ mealPlansPage }) => {
    const currentCount = await mealPlansPage.getMealPlanCount();
    expect(currentCount).toBeGreaterThanOrEqual(0);
  });

  test('should create a new meal plan via API and view in UI', async ({ mealPlansPage, page }) => {
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    mealPlanId = created.id;

    await mealPlansPage.goto();
    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();

    const newCount = await mealPlansPage.getMealPlanCount();
    expect(newCount).toBeGreaterThanOrEqual(initialMealPlanCount + 1);
  });

  test('should view meal plan details', async ({ mealPlansPage, page }) => {
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    mealPlanId = created.id;

    await mealPlansPage.goto();
    const cards = page.locator('article');
    const firstCard = cards.first();
    await firstCard.click();

    await expect(page.locator('div.fixed.inset-0')).toBeVisible();
  });

  test('should edit an existing meal plan', async ({ mealPlansPage, page }) => {
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    mealPlanId = created.id;
    const updatedCalories = 2500;

    await mealPlansPage.goto();
    const cards = page.locator('article');
    const firstCard = cards.first();
    await firstCard.click();

    await mealPlansPage.clickEditButton();

    await page.fill(mealPlansPage.targetCaloriesInput, updatedCalories.toString());
    await page.click('button[type="submit"]');

    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible({ timeout: 10000 });
  });

  test('should delete a meal plan', async ({ mealPlansPage, page }) => {
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    mealPlanId = created.id;

    await mealPlansPage.goto();
    const afterCreateCount = await mealPlansPage.getMealPlanCount();
    expect(afterCreateCount).toBeGreaterThanOrEqual(initialMealPlanCount + 1);

    const cards = page.locator('article');
    const firstCard = cards.first();
    await firstCard.click();

    await mealPlansPage.clickDeleteButton();
    await mealPlansPage.confirmDelete();

    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible({ timeout: 10000 });
    await mealPlansPage.goto();

    const afterDeleteCount = await mealPlansPage.getMealPlanCount();
    expect(afterDeleteCount).toBe(initialMealPlanCount);
  });

  test('should validate required meal plan fields', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    await page.click('button[type="submit"]');

    const errorVisible = await page.isVisible('text=required') ||
                        await page.isVisible('text=Start date is required') ||
                        await page.isVisible('text=End date is required');
    expect(errorVisible).toBeTruthy();
  });

  test.afterEach(async ({ page, mealPlansPage }) => {
    if (mealPlanId) {
      try {
        await deleteResource(`${BACKEND_URL}/meal-plans/${mealPlanId}`);
      } catch (e) {
        console.log('Failed to cleanup meal plan:', e);
      }
      mealPlanId = null;
    }
  });
});
