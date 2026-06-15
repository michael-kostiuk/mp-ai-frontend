import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class MealPlansPage extends BasePage {
  readonly addMealPlanButton = 'button:has-text("Create Meal Plan")';
  readonly createModal = 'div.fixed.inset-0';
  readonly modalTitle = 'h2:has-text("Create Meal Plan"), h2:has-text("Edit Meal Plan"), h2:has-text("Review Generated Plan")';
  readonly startDateInput = 'input[name="start_date"]';
  readonly endDateInput = 'input[name="end_date"]';
  readonly peopleCountInput = 'input[name="people_count"]';
  readonly targetCaloriesInput = 'input[name="target_calories"]';
  readonly submitButton = 'button[type="submit"]';
  readonly cancelButton = 'button:has-text("Cancel")';
  readonly nameInput = 'input[name="name"]';

  async goto() {
    await super.goto('/meal-plans');
    await this.waitForElement('h1:has-text("Meal Plans")');
  }

  async clickAddMealPlan() {
    await this.clickElement(this.addMealPlanButton);
    await this.waitForElement(this.modalTitle);
  }

  async createMealPlan(mealPlanData: {
    startDate: string;
    endDate: string;
    peopleCount: number;
    targetCalories: number;
  }) {
    await this.clickAddMealPlan();
    await this.fillInput(this.startDateInput, mealPlanData.startDate);
    await this.fillInput(this.endDateInput, mealPlanData.endDate);
    await this.fillInput(this.peopleCountInput, mealPlanData.peopleCount.toString());
    await this.fillInput(this.targetCaloriesInput, mealPlanData.targetCalories.toString());
    await this.clickElement(this.submitButton);
  }

  async getMealPlanCount(): Promise<number> {
    return await this.page.locator('[data-testid="meal-plan-card"]').count();
  }

  async isMealPlanVisible(planText: string): Promise<boolean> {
    return await this.page.locator('[data-testid="meal-plan-card"]').filter({ hasText: planText }).first().isVisible();
  }

  async openMealPlanDetail(planIdentifier: string) {
    const card = this.page.locator('[data-testid="meal-plan-card"]').filter({ hasText: planIdentifier }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await this.waitForElement('div.fixed.inset-0');
  }

  async clickEditButton() {
    await this.page.click('button:has-text("Edit Plan")');
  }

  async clickDeleteButton() {
    await this.page.click('button:has-text("Delete Plan")');
  }

  async confirmDelete() {
    await this.page.click('button:has-text("Confirm Delete"), button:has-text("Confirm")');
  }
}
