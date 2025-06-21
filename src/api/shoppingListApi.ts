import apiClient from './apiClient';
import { ShoppingList, Recipe } from '../types';
import { createQueryString } from '../utils/apiUtils';

const BASE_PATH = '/shopping-lists';

export const getShoppingLists = async (): Promise<ShoppingList[]> => {
  return apiClient.get<ShoppingList[]>(BASE_PATH);
};

export const getShoppingList = async (id: number): Promise<ShoppingList> => {
  return apiClient.get<ShoppingList>(`${BASE_PATH}/${id}`);
};

export const deleteShoppingList = async (id: number): Promise<void> => {
  return apiClient.delete<void>(`${BASE_PATH}/${id}`);
};

export const exportShoppingList = async (id: number, format: string = 'ios_reminders'): Promise<any> => {
  const params = { format };
  const queryString = createQueryString(params);
  return apiClient.get<any>(`${BASE_PATH}/${id}/export${queryString}`);
};

export const getShoppingListItemRecipes = async (itemId: number): Promise<Recipe[]> => {
  return apiClient.get<Recipe[]>(`${BASE_PATH}/item/${itemId}/recipes`);
};