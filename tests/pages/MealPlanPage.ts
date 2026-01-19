import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MealPlanPage extends BasePage {
    readonly createMealPlanButton: Locator;

    constructor(page: Page) {
        super(page, '/meal-plans');
        this.createMealPlanButton = page.getByRole('button', { name: 'Create Meal Plan' });
    }

    async startCreatePlan() {
        await this.createMealPlanButton.click();
        await expect(this.page.getByRole('heading', { name: /Create Meal Plan/i })).toBeVisible();
    }

    async fillPlanDetails(details: { startDate: string, endDate: string, people?: string, calories?: string }) {
        await this.page.getByLabel('Start Date').fill(details.startDate);
        await this.page.getByLabel('End Date').fill(details.endDate);
        if (details.people) await this.page.getByLabel('People Count').fill(details.people);
        if (details.calories) await this.page.getByLabel('Target Calories per Day').fill(details.calories);
    }

    async addMealToPlan(recipeName: string) {
        await this.page.getByRole('button', { name: 'Add Meal' }).first().click();
        const searchInput = this.page.getByPlaceholder('Search for recipe...').last();
        await expect(searchInput).toBeVisible();
        const [searchResponse] = await Promise.all([
            this.page.waitForResponse(resp => {
                if (resp.request().method() !== 'GET') return false;
                const url = new URL(resp.url());
                if (url.pathname !== '/recipes/' && url.pathname !== '/recipes') return false;
                const name = url.searchParams.get('name');
                return name ? name.includes(recipeName) : false;
            }),
            searchInput.fill(recipeName)
        ]);
        if (!searchResponse.ok()) {
            throw new Error(`Recipe search failed: ${searchResponse.status()}`);
        }

        const option = this.page
            .getByRole('button')
            .filter({ hasText: recipeName })
            .filter({ hasNotText: /Create\s+"/ })
            .first();
        await expect(option).toBeVisible({ timeout: 15000 });
        await option.click();
    }

    async submitPlan() {
        const submitButton = this.page
            .locator('form')
            .getByRole('button', { name: /Create Meal Plan|Update Meal Plan|Generate Meal Plan|Save Meal Plan/i })
            .last();

        await expect(submitButton).toBeVisible();
        await submitButton.click();
    }

    async openPlanDetails(dateRangeText: string) {
        const planCard = this.page.getByText(dateRangeText).first();
        await expect(planCard).toBeVisible({ timeout: 15000 });
        await planCard.click();
        await expect(this.page.getByRole('heading', { name: 'Meal Plan Details' })).toBeVisible({ timeout: 15000 });
    }

    async deletePlan(planId: number, dateRangeText: string) {
        await this.openPlanDetails(dateRangeText);
        await this.page.getByRole('button', { name: 'Delete Plan' }).click();

        await Promise.all([
            this.page.waitForResponse(resp => {
                if (resp.request().method() !== 'DELETE') return false;
                const url = new URL(resp.url());
                return url.pathname === `/meal-plans/${planId}` && resp.status() >= 200 && resp.status() < 300;
            }),
            this.page.getByRole('button', { name: 'Confirm Delete' }).click()
        ]);

        await expect(this.page.getByRole('heading', { name: 'Meal Plan Details' })).not.toBeVisible({ timeout: 15000 });
    }
}
