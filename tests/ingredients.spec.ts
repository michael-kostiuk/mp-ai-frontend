import { test, expect } from './fixtures/test-setup';

test.describe('Ingredient Management', () => {
  test('View and search ingredients', async ({ page }) => {
    await page.goto('/ingredients');
    await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible();
    await expect(page.getByPlaceholder('Search ingredients...')).toBeVisible();

    await page.getByPlaceholder('Search ingredients...').fill('rice');
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Create ingredient and clean up by merging', async ({ page, createdIngredientNames }) => {
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ingredientName = `E2E Ingredient ${unique}`;
    createdIngredientNames.push(ingredientName);

    await page.goto('/ingredients');
    await page.getByRole('button', { name: 'Add Ingredient' }).click();
    await expect(page.getByText('Add New Ingredient')).toBeVisible();

    await page.getByLabel('Ingredient Name').fill(ingredientName);
    await page.locator('form').getByRole('button', { name: 'Add Ingredient' }).click();

    await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible();
    await page.getByPlaceholder('Search ingredients...').fill(ingredientName);
    await expect(page.getByText(ingredientName)).toBeVisible();

    await page.getByRole('button', { name: 'Merge Ingredients' }).click();
    const mergeHeading = page.getByRole('heading', { name: 'Merge Ingredients' });
    await expect(mergeHeading).toBeVisible();
    const mergeModal = mergeHeading.locator('..').locator('..');

    const keepInput = page.getByPlaceholder('Search for ingredient to keep...');
    await keepInput.click();
    const keepCandidates = ['Rice', 'Chicken', 'Salt', 'Tomato'];
    let keepSelected = false;
    for (const candidate of keepCandidates) {
      await Promise.all([
        page.waitForResponse((resp) => {
          if (resp.request().method() !== 'GET') return false;
          const url = new URL(resp.url());
          if (url.pathname !== '/ingredients/' && url.pathname !== '/ingredients') return false;
          const name = url.searchParams.get('name');
          return name ? name.toLowerCase().includes(candidate.toLowerCase()) : false;
        }),
        keepInput.fill(candidate)
      ]);
      const option = mergeModal
        .getByRole('button')
        .filter({ hasText: new RegExp(candidate, 'i') })
        .filter({ hasNotText: /Create\s+"/ })
        .first();
      if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
        await option.click();
        keepSelected = true;
        break;
      }
    }
    if (!keepSelected) {
      throw new Error('Could not find a keep ingredient option.');
    }

    const mergeInput = page.getByPlaceholder('Search for ingredient to merge...');
    await Promise.all([
      page.waitForResponse((resp) => {
        if (resp.request().method() !== 'GET') return false;
        const url = new URL(resp.url());
        if (url.pathname !== '/ingredients/' && url.pathname !== '/ingredients') return false;
        const name = url.searchParams.get('name');
        return name ? name.includes(ingredientName) : false;
      }),
      mergeInput.fill(ingredientName)
    ]);
    const mergeOption = mergeModal
      .getByRole('button')
      .filter({ hasText: ingredientName })
      .filter({ hasNotText: /Create\s+"/ })
      .first();
    await expect(mergeOption).toBeVisible({ timeout: 15000 });
    await mergeOption.click();

    await mergeModal.locator('form').getByRole('button', { name: 'Merge Ingredients' }).click();

    await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible();
    await page.getByPlaceholder('Search ingredients...').fill(ingredientName);
    await expect(page.getByText(ingredientName)).toHaveCount(0);

    createdIngredientNames.pop();
  });
});
