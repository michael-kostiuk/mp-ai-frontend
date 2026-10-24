import { test, expect, setupBackend } from './fixtures/testFixtures';
import { BACKEND_URL } from './utils/testHelpers';

type ShoppingListResponse = {
  id: number;
  meal_plan_id: number;
  items: { id: number; status: string; ingredient: { name: string } }[];
};

const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${BACKEND_URL}${path}`);
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
  return response.json() as Promise<T>;
};

// Generates a fresh list from the first meal plan that produces items
const generateShoppingList = async (): Promise<ShoppingListResponse> => {
  const plans = await getJson<{ id: number }[]>('/meal-plans/');
  for (const plan of plans) {
    const list = await getJson<ShoppingListResponse>(`/meal-plans/${plan.id}/shopping-list`);
    if (list.items.length > 0) return list;
    await fetch(`${BACKEND_URL}/shopping-lists/${list.id}`, { method: 'DELETE' });
  }
  throw new Error('No meal plan with ingredients to build a shopping list from');
};

test.describe('Shopping Lists', () => {
  test.beforeEach(async ({ page }) => {
    await setupBackend(page);
  });

  test('checked items are saved to the server and survive a reload', async ({ page, resourceTracker }) => {
    const list = await generateShoppingList();
    resourceTracker.track('shopping-lists', list.id);
    const firstItem = list.items[0];

    await page.goto(`/shopping-lists/${list.id}`);
    const checkbox = page.getByRole('button', { name: firstItem.ingredient.name, exact: true }).first();
    await expect(checkbox).toHaveAttribute('aria-pressed', 'false');

    const saved = page.waitForResponse(
      (response) => response.url().includes(`/shopping-lists/${list.id}/items`) && response.request().method() === 'PATCH'
    );
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-pressed', 'true');
    expect((await saved).ok()).toBe(true);

    const fromServer = await getJson<ShoppingListResponse>(`/shopping-lists/${list.id}`);
    expect(fromServer.items.find((item) => item.id === firstItem.id)?.status).toBe('purchased');

    await page.reload();
    await expect(
      page.getByRole('button', { name: firstItem.ingredient.name, exact: true }).first()
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('a check made right before a reload is not lost', async ({ page, resourceTracker }) => {
    const list = await generateShoppingList();
    resourceTracker.track('shopping-lists', list.id);
    const firstItem = list.items[0];

    await page.goto(`/shopping-lists/${list.id}`);
    await page.getByRole('button', { name: firstItem.ingredient.name, exact: true }).first().click();
    // Inside the debounce window: the change only lives in the browser so far
    await page.reload();

    await expect(
      page.getByRole('button', { name: firstItem.ingredient.name, exact: true }).first()
    ).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(async () => {
        const fromServer = await getJson<ShoppingListResponse>(`/shopping-lists/${list.id}`);
        return fromServer.items.find((item) => item.id === firstItem.id)?.status;
      })
      .toBe('purchased');
  });

  test('list links to its meal plan and the meal plan links back', async ({ page, resourceTracker }) => {
    const list = await generateShoppingList();
    resourceTracker.track('shopping-lists', list.id);

    await page.goto(`/shopping-lists/${list.id}`);
    await page.getByRole('link', { name: /Meal plan/ }).click();
    await expect(page).toHaveURL(new RegExp(`/meal-plans/${list.meal_plan_id}$`));

    await page.getByRole('link', { name: 'Open list' }).click();
    await expect(page).toHaveURL(new RegExp(`/shopping-lists/${list.id}$`));
  });

  test('lists are shown newest first', async ({ page, resourceTracker }) => {
    const older = await generateShoppingList();
    resourceTracker.track('shopping-lists', older.id);
    const newer = await generateShoppingList();
    resourceTracker.track('shopping-lists', newer.id);

    await page.goto('/shopping-lists');
    const titles = page.locator('h3', { hasText: 'Shopping List #' });
    await expect(titles.first()).toHaveText(`Shopping List #${newer.id}`);
  });

  test('recipes of an item link to the recipe and back', async ({ page, resourceTracker }) => {
    const list = await generateShoppingList();
    resourceTracker.track('shopping-lists', list.id);

    await page.goto(`/shopping-lists/${list.id}`);
    await page.getByRole('button', { name: 'Recipes' }).first().click();
    const recipeLink = page.locator(`a[href*="?fromShoppingList=${list.id}"]`).first();
    await expect(recipeLink).toBeVisible();
    await recipeLink.click();
    await expect(page).toHaveURL(/\/recipes\/\d+\?fromShoppingList=/);

    await page.getByText('Back to Shopping List').first().click();
    await expect(page).toHaveURL(new RegExp(`/shopping-lists/${list.id}$`));
  });
});
