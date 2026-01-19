import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class IngredientsPage extends BasePage {
  readonly addIngredientButton = 'button:has-text("Add Ingredient")';
  readonly mergeIngredientsButton = 'button:has-text("Merge Ingredients")';
  readonly searchInput = 'input[placeholder*="Search ingredients"]';
  readonly createModal = 'div.fixed.inset-0';
  readonly modalTitle = 'h2:has-text("Add New Ingredient"), h2:has-text("Edit Ingredient")';
  readonly submitButton = 'button[type="submit"]';
  readonly cancelButton = 'button:has-text("Cancel")';
  readonly nameInput = 'input[name="name"]';
  readonly caloriesInput = 'input[name="calories"]';

  async goto() {
    await super.goto('/ingredients');
    await this.waitForElement('h1:has-text("Ingredients")');
  }

  async clickAddIngredient() {
    await this.clickElement(this.addIngredientButton);
    await this.waitForElement(this.modalTitle);
  }

  async createIngredient(ingredientData: {
    name: string;
    category: string;
    baseUnit: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }) {
    await this.clickAddIngredient();
    await this.page.getByLabel('Ingredient Name').fill(ingredientData.name);
    await this.page.getByLabel('Category').selectOption(ingredientData.category);
    await this.page.getByLabel('Base Unit').selectOption(ingredientData.baseUnit);
    const numberInputs = this.page.locator('input[type="number"]');
    await numberInputs.nth(0).fill(ingredientData.calories.toString());
    await numberInputs.nth(1).fill(ingredientData.protein.toString());
    await numberInputs.nth(2).fill(ingredientData.carbs.toString());
    await numberInputs.nth(3).fill(ingredientData.fats.toString());
    await this.clickElement(this.submitButton);
  }

  async searchIngredients(query: string) {
    await this.fillInput(this.searchInput, query);
  }

  async getIngredientCount(): Promise<number> {
    return await this.page.locator('tbody tr').count();
  }

  async isIngredientVisible(ingredientName: string): Promise<boolean> {
    return await this.page.isVisible(`text=${ingredientName}`);
  }
}
