import { test, expect } from './fixtures/test-setup';

test.describe('Responsive Design', () => {
    test('Desktop View', async ({ page, recipePage }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await recipePage.navigate();
        await expect(page.getByRole('heading', { name: 'Recipes' }).first()).toBeVisible();
    });

    test('Tablet View', async ({ page, recipePage }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await recipePage.navigate();
        await expect(page.getByRole('heading', { name: 'Recipes' }).first()).toBeVisible();
    });

    test('Mobile View', async ({ page, recipePage }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await recipePage.navigate();
        await expect(page.getByRole('heading', { name: 'Recipes' }).first()).toBeVisible();
    });
});
