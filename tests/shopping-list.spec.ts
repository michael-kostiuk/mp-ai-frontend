import { test, expect } from './fixtures/test-setup';

test.describe('Shopping Lists', () => {
  test('Shopping lists page renders', async ({ page }) => {
    await page.goto('/shopping-lists');
    await expect(page.getByRole('heading', { name: 'Shopping Lists' }).first()).toBeVisible({ timeout: 15000 });

    await page.waitForResponse(resp => {
      if (resp.request().method() !== 'GET') return false;
      const url = new URL(resp.url());
      return (url.pathname === '/shopping-lists' || url.pathname === '/shopping-lists/') && resp.status() === 200;
    }, { timeout: 60000 }).catch(() => undefined);

    const loadingText = page.getByText(/Loading shopping lists\.\.\./i);
    const emptyText = page.getByText(/don't have any shopping lists yet/i);
    const emptyLink = page.getByRole('link', { name: /Go to Meal Plans/i });
    const listTitle = page.getByText(/Shopping List #\d+/).first();
    const errorHeading = page.getByRole('heading', { name: /Failed to load shopping lists/i });

    await expect
      .poll(async () => {
        const loadingVisible = await loadingText.isVisible().catch(() => false);
        const emptyVisible = await emptyText.isVisible().catch(() => false);
        const listVisible = await listTitle.isVisible().catch(() => false);
        const errorVisible = await errorHeading.isVisible().catch(() => false);
        return (loadingVisible ? false : (listVisible || emptyVisible || errorVisible));
      }, { timeout: 120000 })
      .toBe(true);

    await expect(errorHeading).toHaveCount(0);

    if (await emptyText.isVisible().catch(() => false)) {
      await expect(emptyText).toBeVisible();
      await expect(emptyLink).toBeVisible();
    } else {
      await expect(listTitle).toBeVisible();
    }
  });
});
