import { Page } from '@playwright/test';

export const BACKEND_URL = 'http://be:8000';

export async function configureBackendUrl(page: Page) {
  console.log('Note: Using default frontend configuration');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

export async function createRecipeViaApi(recipeData: any): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/recipes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipeData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to create recipe. Status: ${response.status}, Response: ${errorText}`);
    throw new Error(`Failed to create recipe: ${response.statusText}`);
  }
  return response.json();
}

export async function createIngredientViaApi(ingredientData: any): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/ingredients/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredientData)
  });
  if (!response.ok) throw new Error(`Failed to create ingredient: ${response.statusText}`);
  return response.json();
}

export async function createMealPlanViaApi(mealPlanData: any): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/meal-plans/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mealPlanData)
  });
  if (!response.ok) throw new Error(`Failed to create meal plan: ${response.statusText}`);
  return response.json();
}

export async function deleteResource(url: string): Promise<void> {
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete resource: ${response.statusText}`);
}

export function generateUniqueName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

export async function waitForApiResponse<T>(page: Page, urlPattern: string | RegExp): Promise<T> {
  return page.waitForResponse(async (response) => {
    const url = response.url();
    const matches = typeof urlPattern === 'string' 
      ? url.includes(urlPattern) 
      : urlPattern.test(url);
    return matches && response.ok();
  }).then((response) => response.json() as Promise<T>);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
