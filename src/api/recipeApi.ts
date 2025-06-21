import apiClient from './apiClient';
import { Recipe, RecipeCreate, RecipeFilterParams } from '../types';
import { createQueryString } from '../utils/apiUtils';

const BASE_PATH = '/recipes';

export const getRecipes = async (params?: RecipeFilterParams): Promise<Recipe[]> => {
  const queryString = createQueryString(params || {});
  return apiClient.get<Recipe[]>(`${BASE_PATH}/${queryString}`);
};

export const getRecipe = async (id: number): Promise<Recipe> => {
  return apiClient.get<Recipe>(`${BASE_PATH}/${id}`);
};

export const createRecipe = async (recipe: RecipeCreate): Promise<Recipe> => {
  return apiClient.post<Recipe>(BASE_PATH, recipe);
};

export const updateRecipe = async (id: number, recipe: RecipeCreate): Promise<Recipe> => {
  return apiClient.put<Recipe>(`${BASE_PATH}/${id}`, recipe);
};

export const deleteRecipe = async (id: number): Promise<void> => {
  return apiClient.delete<void>(`${BASE_PATH}/${id}`);
};

export const searchRecipes = async (query: string, filters?: Omit<RecipeFilterParams, 'skip' | 'limit'>): Promise<Recipe[]> => {
  const params = { query, ...filters };
  const queryString = createQueryString(params);
  return apiClient.get<Recipe[]>(`${BASE_PATH}/search${queryString}`);
};

export const exportRecipes = async (): Promise<Recipe[]> => {
  return apiClient.get<Recipe[]>(`${BASE_PATH}/export`);
};

export const bulkImportRecipes = async (recipes: RecipeCreate[]): Promise<Recipe[]> => {
  return apiClient.post<Recipe[]>(`${BASE_PATH}/bulk-import`, recipes);
};