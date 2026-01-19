import apiClient from './apiClient';
import { ApiError, Ingredient, IngredientCreate } from '../types';

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
