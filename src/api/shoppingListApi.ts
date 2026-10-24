import apiClient from './apiClient';
import { ShoppingList, ShoppingListItemStatus, Recipe } from '../types';
import { createQueryString } from '../utils/apiUtils';

const BASE_PATH = '/shopping-lists';

export const getShoppingLists = async (): Promise<ShoppingList[]> => {
  return apiClient.get<ShoppingList[]>(BASE_PATH);
};

export const getMealPlanShoppingLists = async (mealPlanId: number): Promise<ShoppingList[]> => {
  return apiClient.get<ShoppingList[]>(BASE_PATH, { meal_plan_id: mealPlanId });
};

export interface ShoppingListItemStatusUpdate {
  id: number;
  status: ShoppingListItemStatus;
}

export const updateShoppingListItemsStatus = async (
  listId: number,
  items: ShoppingListItemStatusUpdate[],
  options: { keepalive?: boolean } = {}
): Promise<ShoppingListItemStatusUpdate[]> => {
  return apiClient.patch<ShoppingListItemStatusUpdate[]>(`${BASE_PATH}/${listId}/items`, { items }, options);
};

export const getShoppingList = async (id: number): Promise<ShoppingList> => {
  return apiClient.get<ShoppingList>(`${BASE_PATH}/${id}`);
};

export const deleteShoppingList = async (id: number): Promise<void> => {
  return apiClient.delete<void>(`${BASE_PATH}/${id}`);
};

export const exportShoppingList = async (id: number, format: string = 'ios_reminders'): Promise<unknown> => {
  const params = { format };
  const queryString = createQueryString(params);
  return apiClient.get<unknown>(`${BASE_PATH}/${id}/export${queryString}`);
};

export const getShoppingListItemRecipes = async (itemId: number): Promise<Recipe[]> => {
  return apiClient.get<Recipe[]>(`${BASE_PATH}/item/${itemId}/recipes`);
};
