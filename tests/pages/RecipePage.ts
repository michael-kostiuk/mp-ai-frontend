import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RecipePage extends BasePage {
    readonly addRecipeButton: Locator;
    readonly createRecipeButton: Locator;

    // Form Inputs
    readonly recipeNameInput: Locator;
    readonly categorySelect: Locator;
    readonly servingsInput: Locator;
    readonly prepTimeInput: Locator;
    readonly cookTimeInput: Locator;
    readonly instructionsInput: Locator;

    // Ingredient Helpers
    readonly addIngredientButton: Locator;
    readonly ingredientSearchInput: Locator;

    constructor(page: Page) {
        super(page, '/recipes');
        this.addRecipeButton = page.getByRole('button', { name: 'Add Recipe' });
        this.createRecipeButton = page.getByRole('button', { name: 'Create Recipe' });

        this.recipeNameInput = page.getByLabel('Recipe Name');
        this.categorySelect = page.getByLabel('Category');
        this.servingsInput = page.getByLabel('Servings');
        this.prepTimeInput = page.getByLabel('Prep Time');
        this.cookTimeInput = page.getByLabel('Cook Time');
        this.instructionsInput = page.getByPlaceholder('Enter cooking instructions...');

        this.addIngredientButton = page.getByRole('button', { name: 'Add Ingredient' });
        this.ingredientSearchInput = page.getByPlaceholder('Search ingredient...').first();
    }

    async openCreateModal() {
        await this.addRecipeButton.click();
        await expect(this.page.getByRole('heading', { name: /Create New Recipe|New Recipe/i })).toBeVisible();
    }

    async fillRecipeDetails(details: {
        name: string,
        category?: string,
        servings?: string,
        prepTime?: string,
        cookTime?: string,
        instructions?: string
    }) {
        await this.recipeNameInput.fill(details.name);
        if (details.category) await this.categorySelect.selectOption({ label: details.category });
        if (details.servings) await this.servingsInput.fill(details.servings);
        if (details.prepTime) await this.prepTimeInput.fill(details.prepTime);
        if (details.cookTime) await this.cookTimeInput.fill(details.cookTime);
        if (details.instructions) await this.instructionsInput.fill(details.instructions);
    }

    async addIngredient(name: string, quantity?: string, unit?: string) {
        await this.addIngredientButton.click();

        // Wait for the new input to be attached and visible
        const searchInput = this.page.getByPlaceholder('Search ingredient...').last();
        await expect(searchInput).toBeVisible();

        await searchInput.fill(name);

        const createButton = this.page.getByRole('button', { name: new RegExp(`Create "${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}"`) }).first();
        const resultButton = this.page
            .getByRole('button')
            .filter({ hasText: name })
            .filter({ hasNotText: /Create\s+"/ })
            .first();

        if (await createButton.isVisible({ timeout: 1500 }).catch(() => false)) {
            await createButton.click();

            const ingredientModalHeading = this.page.getByRole('heading', { name: 'Add New Ingredient' });
            await expect(ingredientModalHeading).toBeVisible();

            await this.page.getByLabel('Ingredient Name').fill(name);

            const ingredientModal = ingredientModalHeading.locator('xpath=ancestor::div[contains(@class,"bg-white")][1]');
            const [createIngredientResponse] = await Promise.all([
                this.page.waitForResponse(resp => {
                    if (resp.request().method() !== 'POST') return false;
                    const url = new URL(resp.url());
                    return url.pathname === '/ingredients' || url.pathname === '/ingredients/';
                }),
                ingredientModal.getByRole('button', { name: 'Add Ingredient' }).click()
            ]);

            if (createIngredientResponse.status() >= 400) {
                throw new Error(`Create ingredient failed: ${createIngredientResponse.status()}`);
            }

            await expect(ingredientModalHeading).not.toBeVisible({ timeout: 15000 });
        } else if (await resultButton.isVisible({ timeout: 1500 }).catch(() => false)) {
            await resultButton.click();
        } else {
            await expect(resultButton).toBeVisible({ timeout: 5000 });
            await resultButton.click();
        }

        if (quantity) {
            await this.page.getByPlaceholder('Qty').last().fill(quantity);
        }
        if (unit) {
            await this.page.getByRole('combobox').last().selectOption(unit);
        }
    }

    async submitRecipe() {
        const createBtn = this.page.getByRole('button', { name: 'Create Recipe' });
        const updateBtn = this.page.getByRole('button', { name: 'Update Recipe' });

        if (await updateBtn.isVisible()) {
            await updateBtn.click();
        } else {
            await createBtn.click();
        }
        await expect(this.page.getByRole('heading', { name: /Create New Recipe|New Recipe|Edit/i })).not.toBeVisible();
    }

    async deleteRecipe(name: string) {
        await this.page.getByPlaceholder('Search recipes...').fill(name);
        await this.page.waitForTimeout(500); // Search debounce

        const recipeCard = this.page.getByText(name).first();
        await expect(recipeCard).toBeVisible({ timeout: 15000 });
        await recipeCard.click();

        await expect(this.page.getByRole('heading', { name: 'Recipe Details' })).toBeVisible();
        await this.page.getByRole('button', { name: 'Delete Recipe' }).click();
        const [deleteResponse] = await Promise.all([
            this.page.waitForResponse(resp => {
                if (resp.request().method() !== 'DELETE') return false;
                const url = new URL(resp.url());
                return url.pathname.startsWith('/recipes/');
            }),
            this.page.getByRole('button', { name: 'Confirm Delete' }).click()
        ]);

        if (!deleteResponse.ok()) {
            throw new Error(`Delete recipe failed: ${deleteResponse.status()}`);
        }

        await expect(this.page.getByRole('heading', { name: 'Recipe Details' })).not.toBeVisible({ timeout: 15000 });

        await this.page.getByPlaceholder('Search recipes...').fill(name);
        await this.page.waitForTimeout(500); // Search debounce
        await expect(this.page.getByText(name)).toHaveCount(0);
    }
}
