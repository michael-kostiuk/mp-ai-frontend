import apiClient from './apiClient';
import { MealPlan, MealPlanCreate, MealPlanEntry, MealPlanEntryCreate, ShoppingList } from '../types';
import { createQueryString } from '../utils/apiUtils';

const BASE_PATH = '/meal-plans';

export const getMealPlans = async (userId: number): Promise<MealPlan[]> => {
  return apiClient.get<MealPlan[]>(BASE_PATH, { user_id: userId });
};

export const getMealPlan = async (id: number): Promise<MealPlan> => {
  return apiClient.get<MealPlan>(`${BASE_PATH}/${id}`);
};

export const createMealPlan = async (mealPlan: MealPlanCreate): Promise<MealPlan> => {
  return apiClient.post<MealPlan>(BASE_PATH, mealPlan);
};

export const updateMealPlan = async (id: number, mealPlan: MealPlanCreate): Promise<MealPlan> => {
  return apiClient.put<MealPlan>(`${BASE_PATH}/${id}`, mealPlan);
};

export const deleteMealPlan = async (id: number): Promise<void> => {
  return apiClient.delete<void>(`${BASE_PATH}/${id}`);
};

export const updateMealEntry = async (
  mealPlanId: number,
  mealId: number,
  entry: MealPlanEntryCreate
): Promise<MealPlanEntry> => {
  return apiClient.put<MealPlanEntry>(`${BASE_PATH}/${mealPlanId}/meals/${mealId}`, entry);
};

export const generateShoppingList = async (mealPlanId: number): Promise<ShoppingList> => {
  return apiClient.get<ShoppingList>(`${BASE_PATH}/${mealPlanId}/shopping-list`);
};

export const autoGenerateMealPlan = async (
  params: {
    start_date: string;
    days: number;
    target_calories: number;
    people_count: number;
    user_id: number;
    dietary_preferences?: string[];
  }
): Promise<MealPlan> => {
  const queryString = createQueryString(params);
  return apiClient.post<MealPlan>(`${BASE_PATH}/auto-generate${queryString}`);
};