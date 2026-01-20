import { test, expect, setupBackend, generateTestMealPlan, createMealPlanViaApi } from './fixtures/testFixtures';

test.describe('Meal Plan Management - CRUD Operations', () => {
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

  test('should create a new meal plan via API and view in UI', async ({ mealPlansPage, page, resourceTracker }) => {
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    resourceTracker.track('meal-plans', created.id);

    await mealPlansPage.goto();
    const planIdentifier = testMealPlan.dietary_preferences[0];
    const planCard = page.locator('[data-testid="meal-plan-card"]').filter({ hasText: planIdentifier });
    await expect(planCard).toBeVisible({ timeout: 10000 });

    const newCount = await mealPlansPage.getMealPlanCount();
    expect(newCount).toBeGreaterThanOrEqual(initialMealPlanCount + 1);
  });

  test('should view meal plan details', async ({ mealPlansPage, page, resourceTracker }) => {
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    resourceTracker.track('meal-plans', created.id);

    await mealPlansPage.goto();
    await mealPlansPage.openMealPlanDetail(testMealPlan.dietary_preferences[0]);

    await expect(page.locator('div.fixed.inset-0')).toBeVisible();
    await expect(page.locator('text=Meal Plan Details')).toBeVisible();
    await expect(page.locator(`text=${testMealPlan.dietary_preferences[0]}`)).toBeVisible();
  });

  test('should edit an existing meal plan', async ({ mealPlansPage, page, resourceTracker }) => {
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    resourceTracker.track('meal-plans', created.id);
    const updatedCalories = testMealPlan.target_calories + 250;

    await mealPlansPage.goto();
    await mealPlansPage.openMealPlanDetail(testMealPlan.dietary_preferences[0]);
    await mealPlansPage.clickEditButton();

    await page.fill(mealPlansPage.targetCaloriesInput, updatedCalories.toString());
    await page.click('button[type="submit"]');

    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible({ timeout: 10000 });

    await mealPlansPage.goto();
    await mealPlansPage.openMealPlanDetail(testMealPlan.dietary_preferences[0]);
    await expect(page.locator('text=Target Cal/Day')).toBeVisible();
    await expect(page.locator(`text=${updatedCalories}`)).toBeVisible();
  });

  test('should delete a meal plan', async ({ mealPlansPage, page, resourceTracker }) => {
    const testMealPlan = generateTestMealPlan();
    const created = await createMealPlanViaApi(testMealPlan);
    resourceTracker.track('meal-plans', created.id);

    await mealPlansPage.goto();
    const afterCreateCount = await mealPlansPage.getMealPlanCount();
    expect(afterCreateCount).toBeGreaterThanOrEqual(initialMealPlanCount + 1);

    await mealPlansPage.openMealPlanDetail(testMealPlan.dietary_preferences[0]);
    await mealPlansPage.clickDeleteButton();
    await mealPlansPage.confirmDelete();

    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible({ timeout: 10000 });
    await mealPlansPage.goto();

    const afterDeleteCount = await mealPlansPage.getMealPlanCount();
    expect(afterDeleteCount).toBe(initialMealPlanCount);

    const isPlanVisible = await mealPlansPage.isMealPlanVisible(testMealPlan.dietary_preferences[0]);
    expect(isPlanVisible).toBeFalsy();
  });

  test('should validate required meal plan fields', async ({ mealPlansPage, page }) => {
    await mealPlansPage.clickAddMealPlan();
    await page.click('button[type="submit"]');

    const errorVisible = await page.isVisible('text=required') ||
                        await page.isVisible('text=Start date is required') ||
                        await page.isVisible('text=End date is required');
    expect(errorVisible).toBeTruthy();
  });
});
