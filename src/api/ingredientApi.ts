import apiClient from './apiClient';
import { ApiError, Ingredient, IngredientCreate, IngredientNutritionBulkResponse, IngredientNutritionEstimateResponse } from '../types';

const BASE_PATH = '/ingredients';

const normalizeIngredientsResponse = (data: unknown): Ingredient[] => {
  if (Array.isArray(data)) {
    return data as Ingredient[];
  }

  const error: ApiError = {
    message: 'Invalid ingredients response',
    status: 0,
    details: data
  };
  throw error;
};

export const getIngredients = async (params?: Record<string, string | number | boolean | Array<string | number | boolean>>): Promise<Ingredient[]> => {
  const data = await apiClient.get<unknown>(BASE_PATH, params);
  return normalizeIngredientsResponse(data);
};

export const createIngredient = async (ingredient: IngredientCreate): Promise<Ingredient> => {
  return apiClient.post<Ingredient>(BASE_PATH, ingredient);
};

export const mergeIngredients = async (keepIngredientId: number, mergeIngredientIds: number[]): Promise<Ingredient> => {
  return apiClient.post<Ingredient>(`${BASE_PATH}/merge?keep_ingredient_id=${keepIngredientId}`, mergeIngredientIds);
};

const normalizeIngredientEstimateResponse = (data: unknown): IngredientNutritionEstimateResponse => {
  if (data && typeof data === 'object' && 'ingredient' in data) {
    const payload = data as { ingredient?: unknown; nutrition_source?: unknown };
    if (payload.ingredient && typeof payload.ingredient === 'object') {
      return {
        ingredient: payload.ingredient as Ingredient,
        nutrition_source: typeof payload.nutrition_source === 'string' ? payload.nutrition_source : undefined
      };
    }
  }

  if (data && typeof data === 'object') {
    return { ingredient: data as Ingredient };
  }

  const error: ApiError = {
    message: 'Invalid ingredient estimate response',
    status: 0,
    details: data
  };
  throw error;
};

const normalizeIngredientBulkResponse = (data: unknown): IngredientNutritionBulkResponse => {
  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    const updatedCount = Number(payload.updated ?? payload.updated_count ?? 0);
    const skippedCount = Number(payload.skipped ?? payload.skipped_count ?? 0);
    const failed = Array.isArray(payload.failed) ? payload.failed : [];
    const ingredients = Array.isArray(payload.ingredients)
      ? payload.ingredients
      : Array.isArray(payload.updated)
        ? payload.updated
        : undefined;

    return {
      updated: Number.isNaN(updatedCount) ? 0 : updatedCount,
      skipped: Number.isNaN(skippedCount) ? 0 : skippedCount,
      failed,
      ingredients
    };
  }

  const error: ApiError = {
    message: 'Invalid ingredient bulk estimate response',
    status: 0,
    details: data
  };
  throw error;
};

export const estimateIngredientNutrition = async (ingredientId: number): Promise<IngredientNutritionEstimateResponse> => {
  const data = await apiClient.post<unknown>(`${BASE_PATH}/${ingredientId}/estimate-nutrition`);
  return normalizeIngredientEstimateResponse(data);
};

export const estimateMissingIngredientNutrition = async (): Promise<IngredientNutritionBulkResponse> => {
  const data = await apiClient.post<unknown>(`${BASE_PATH}/estimate-missing`);
  return normalizeIngredientBulkResponse(data);
};
