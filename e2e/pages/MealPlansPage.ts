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
    return await this.page.locator('article').count();
  }

  async isMealPlanVisible(planName: string): Promise<boolean> {
    return await this.page.isVisible(`text=${planName}`);
  }

  async openMealPlanDetail(planName: string) {
    const cards = this.page.locator('article');
    const count = await cards.count();
    
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const text = await card.textContent();
      if (text && text.includes(planName)) {
        await card.click();
        break;
      }
    }
    
    await this.waitForElement('div.fixed.inset-0');
  }

  async clickEditButton() {
    await this.page.click('button:has-text("Edit")');
  }

  async clickDeleteButton() {
    await this.page.click('button:has-text("Delete")');
  }

  async confirmDelete() {
    await this.page.click('button:has-text("Confirm"), button:has-text("Delete")');
  }
}
