import apiClient from './apiClient';
import { Ingredient, IngredientCreate } from '../types';

const BASE_PATH = '/ingredients';

export const getIngredients = async (params?: Record<string, any>): Promise<Ingredient[]> => {
  return apiClient.get<Ingredient[]>(BASE_PATH, params);
};

export const createIngredient = async (ingredient: IngredientCreate): Promise<Ingredient> => {
  return apiClient.post<Ingredient>(BASE_PATH, ingredient);
};

export const mergeIngredients = async (keepIngredientId: number, mergeIngredientIds: number[]): Promise<Ingredient> => {
  return apiClient.post<Ingredient>(`${BASE_PATH}/merge?keep_ingredient_id=${keepIngredientId}`, mergeIngredientIds);
};