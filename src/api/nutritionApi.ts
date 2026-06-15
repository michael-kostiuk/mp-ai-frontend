import apiClient from './apiClient';

export interface IngredientInput {
    name: string;
    quantity: number;
    unit: string;
}

export interface EstimateNutritionRequest {
    ingredients: IngredientInput[];
    servings?: number;
}

export interface EstimateNutritionResponse {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

const BASE_PATH = '/nutrition';

export const estimateNutrition = async (
    request: EstimateNutritionRequest
): Promise<EstimateNutritionResponse> => {
    return apiClient.post<EstimateNutritionResponse>(`${BASE_PATH}/estimate`, request);
};
