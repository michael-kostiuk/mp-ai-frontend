import { Page } from '@playwright/test';

export const BACKEND_URL = 'http://be:8000';
export const API_CONFIG_KEY = 'apiConfig';
const API_TIMEOUT = 15000;

type ResourceKind = 'recipes' | 'ingredients' | 'meal-plans';

export class ResourceTracker {
  private resources: { kind: ResourceKind; id: number }[] = [];

  track(kind: ResourceKind, id: number) {
    this.resources.push({ kind, id });
  }

  markCleaned(kind: ResourceKind, id: number) {
    this.resources = this.resources.filter(
      (resource) => !(resource.kind === kind && resource.id === id)
    );
  }

  async cleanupAll() {
    const createdResources = [...this.resources].reverse();
    for (const resource of createdResources) {
      if (resource.kind === 'ingredients') {
        await deleteIngredientViaMerge(resource.id);
      } else {
        const resourceUrl = `${BACKEND_URL}/${resource.kind}/${resource.id}`;
        await ensureResourceDeleted(resourceUrl);
      }
    }
    this.resources = [];
  }
}

export async function configureBackendUrl(page: Page) {
  await page.addInitScript(
    ({ backendUrl, storageKey, timeoutMs }) => {
      localStorage.setItem(storageKey, JSON.stringify({ baseUrl: backendUrl, timeout: timeoutMs }));
    },
    { backendUrl: BACKEND_URL, storageKey: API_CONFIG_KEY, timeoutMs: API_TIMEOUT }
  );

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  await page.evaluate(
    ({ backendUrl, storageKey, timeoutMs }) => {
      const expectedConfig = JSON.stringify({ baseUrl: backendUrl, timeout: timeoutMs });
      try {
        const existing = localStorage.getItem(storageKey);
        const parsed = existing ? JSON.parse(existing) : null;
        if (!parsed || parsed.baseUrl !== backendUrl) {
          localStorage.setItem(storageKey, expectedConfig);
        }
      } catch (error) {
        localStorage.setItem(storageKey, expectedConfig);
      }
    },
    { backendUrl: BACKEND_URL, storageKey: API_CONFIG_KEY, timeoutMs: API_TIMEOUT }
  );

  const configuredUrl = await page.evaluate((storageKey) => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    try {
      return JSON.parse(stored).baseUrl as string;
    } catch (error) {
      return null;
    }
  }, API_CONFIG_KEY);

  if (configuredUrl !== BACKEND_URL) {
    throw new Error(`Backend URL misconfigured. Expected ${BACKEND_URL}, but found ${configuredUrl}`);
  }
}

export async function createRecipeViaApi(recipeData: any): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/recipes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipeData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create recipe. Status: ${response.status}, Response: ${errorText}`);
  }
  return response.json();
}

export async function createIngredientViaApi(ingredientData: any): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/ingredients/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredientData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create ingredient. Status: ${response.status}, Response: ${errorText}`);
  }
  return response.json();
}

export async function createMealPlanViaApi(mealPlanData: any): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/meal-plans/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mealPlanData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create meal plan. Status: ${response.status}, Response: ${errorText}`);
  }
  return response.json();
}

export async function ensureResourceDeleted(url: string): Promise<void> {
  const deleteResponse = await fetch(url, { method: 'DELETE' });
  if (![200, 202, 204, 404].includes(deleteResponse.status)) {
    const errorText = await deleteResponse.text();
    throw new Error(`Failed to delete resource (${url}). Status: ${deleteResponse.status}. Body: ${errorText}`);
  }

  const verifyResponse = await fetch(url);
  if (verifyResponse.status !== 404) {
    const body = await verifyResponse.text();
    throw new Error(`Resource still exists after cleanup (${url}). Status: ${verifyResponse.status}. Body: ${body}`);
  }
}

export async function deleteIngredientViaMerge(ingredientId: number): Promise<void> {
  const listResponse = await fetch(`${BACKEND_URL}/ingredients/`);
  if (!listResponse.ok) {
    const body = await listResponse.text();
    throw new Error(`Failed to load ingredients for cleanup. Status: ${listResponse.status}. Body: ${body}`);
  }

  const ingredients = await listResponse.json();
  const keepIngredient = Array.isArray(ingredients) ? ingredients.find((ingredient: any) => ingredient.id !== ingredientId) : null;
  if (!keepIngredient) {
    throw new Error('Unable to find an ingredient to retain while cleaning up test data');
  }

  const mergeResponse = await fetch(`${BACKEND_URL}/ingredients/merge?keep_ingredient_id=${keepIngredient.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([ingredientId])
  });

  if (!mergeResponse.ok) {
    const errorText = await mergeResponse.text();
    throw new Error(`Failed to clean up ingredient ${ingredientId} via merge. Status: ${mergeResponse.status}. Body: ${errorText}`);
  }

  const verifyListResponse = await fetch(`${BACKEND_URL}/ingredients/`);
  const verifyList = verifyListResponse.ok ? await verifyListResponse.json() : [];
  const stillExists = Array.isArray(verifyList) && verifyList.some((ingredient: any) => ingredient.id === ingredientId);
  if (stillExists) {
    throw new Error(`Ingredient ${ingredientId} still exists after cleanup merge`);
  }
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
