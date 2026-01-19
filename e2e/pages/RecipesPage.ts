import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { generateUniqueName } from '../utils/testHelpers';

export class RecipesPage extends BasePage {
  readonly addRecipeButton = 'button:has-text("Add Recipe")';
  readonly addFromImageButton = 'button:has-text("Add from Image")';
  readonly searchInput = 'input[placeholder*="Search"]';
  readonly createModal = 'div.fixed.inset-0';
  readonly modalTitle = 'h2:has-text("Create New Recipe"), h2:has-text("Edit Recipe")';
  readonly nameInput = 'input[type="text"]';
  readonly servingsInput = 'input[type="number"] >> nth=0';
  readonly prepTimeInput = 'input[type="number"] >> nth=1';
  readonly cookTimeInput = 'input[type="number"] >> nth=2';
  readonly caloriesInput = 'input[type="number"] >> nth=3';
  readonly proteinInput = 'input[type="number"] >> nth=4';
  readonly carbsInput = 'input[type="number"] >> nth=5';
  readonly fatsInput = 'input[type="number"] >> nth=6';
  readonly instructionsInput = 'textarea';
  readonly categorySelect = 'select';
  readonly submitButton = 'button[type="submit"]';
  readonly cancelButton = 'button:has-text("Cancel")';

  async goto() {
    await super.goto('/recipes');
    await this.waitForElement('h1:has-text("Recipes")');
  }

  async clickAddRecipe() {
    await this.clickElement(this.addRecipeButton);
    await this.waitForElement(this.modalTitle);
  }

  async createRecipe(recipeData: {
    name: string;
    servings: number;
    prepTime: number;
    cookTime: number;
    instructions: string;
    category: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }) {
    await this.clickAddRecipe();
    await this.page.getByLabel('Recipe Name').fill(recipeData.name);
    await this.page.getByLabel('Category').selectOption(recipeData.category);
    const numberInputs = this.page.locator('input[type="number"]');
    await numberInputs.nth(0).fill(recipeData.servings.toString());
    await numberInputs.nth(1).fill(recipeData.prepTime.toString());
    await numberInputs.nth(2).fill(recipeData.cookTime.toString());
    await this.page.locator('textarea').fill(recipeData.instructions);
    
    // Add an ingredient to recipe (required by form validation)
    await this.addIngredient('Direct Test');
    
    await this.clickElement(this.submitButton);
  }

  async searchRecipes(query: string) {
    await this.fillInput(this.searchInput, query);
  }

  async openRecipeDetail(recipeName: string) {
    await this.page.click(`text=${recipeName}`);
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

  async addIngredient(ingredientName: string) {
    await this.page.click('button:has-text("Add Ingredient")');
    const ingredientInput = this.page.locator('input[placeholder*="Search ingredient"]').last();
    await ingredientInput.fill(ingredientName);
    await this.page.waitForTimeout(1000);
    
    // Try to click on ingredient option if it appears
    try {
      const ingredientOption = this.page.locator('div[role="option"]').or(this.page.locator('[role="listbox"] div')).first();
      await ingredientOption.click({ timeout: 3000 });
    } catch (e) {
      // If ingredient not found, try to create new one
      console.log('Ingredient option not found, may need to create it first');
    }
  }

  async getRecipeCount(): Promise<number> {
    return await this.page.locator('article, div[data-testid*="recipe"]').count();
  }

  async isRecipeVisible(recipeName: string): Promise<boolean> {
    return await this.page.isVisible(`text=${recipeName}`);
  }
}
