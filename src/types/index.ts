// Recipe Types
export interface Recipe {
  id: number;
  name: string;
  servings: number;
  prep_time: number;
  cook_time: number;
  instructions: string;
  category: string;
  dietary_tags?: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  breakfast_weight: number;
  lunch_weight: number;
  dinner_weight: number;
  created_at: string;
  ingredients: RecipeIngredient[];
  image_url?: string;
}

export interface RecipeIngredient {
  ingredient_id: number;
  quantity: number;
  unit: string;
  recipe_id: number;
  ingredient: Ingredient;
}

export interface RecipeCreate {
  name: string;
  servings: number;
  prep_time: number;
  cook_time: number;
  instructions: string;
  category: string;
  dietary_tags: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  breakfast_weight: number;
  lunch_weight: number;
  dinner_weight: number;
  ingredients: RecipeIngredientCreate[];
  image_url?: string;
}

export interface RecipeIngredientCreate {
  ingredient_id: number;
  quantity: number;
  unit: string;
}

export type RecipeFromImageJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'canceled';

export interface ParsedIngredientFromImage {
  raw_name: string;
  quantity?: number | null;
  unit?: string | null;
  preparation?: string | null;
  matched_ingredient_id?: number | null;
  matched_ingredient_name?: string | null;
  match_confidence: number;
  match_type: 'exact' | 'fuzzy_high' | 'ai_verified' | 'unmatched';
  needs_review: boolean;
}

export interface ParsedRecipeFromImage {
  name?: string | null;
  servings?: number | null;
  prep_time?: number | null;
  cook_time?: number | null;
  instructions?: string | null;
  category?: string | null;
  ingredients: ParsedIngredientFromImage[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null;
  warnings: string[];
  raw?: Record<string, unknown> | null;
}

export interface RecipeFromImageStartResponse {
  job_id: string;
}

export interface RecipeFromImageJob {
  id: string;
  status: RecipeFromImageJobStatus;
  current_step: string;
  step_progress: number;
  overall_progress: number;
  result?: ParsedRecipeFromImage | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

// Ingredient Types
export interface Ingredient {
  id: number;
  name: string;
  category: string;
  base_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface IngredientCreate {
  name: string;
  category: string;
  base_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

// Meal Plan Types
export interface MealPlan {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  people_count: number;
  target_calories: number;
  dietary_preferences: string[];
  created_at: string;
  entries: MealPlanEntry[];
}

export interface MealPlanEntry {
  id: number;
  meal_plan_id: number;
  recipe_id: number;
  date: string;
  meal_type: string;
  servings: number;
  recipe: Recipe;
}

export interface MealPlanCreate {
  start_date: string;
  end_date: string;
  people_count: number;
  target_calories: number;
  dietary_preferences: string[];
  entries: MealPlanEntryCreate[];
}

export interface MealPlanEntryCreate {
  recipe_id: number;
  date: string;
  meal_type: string;
  servings: number;
}

// Shopping List Types
export interface ShoppingList {
  id: number;
  meal_plan_id: number;
  status: string;
  export_format: string | null;
  created_at: string;
  items: ShoppingListItem[];
}

export interface ShoppingListItem {
  id: number;
  shopping_list_id: number;
  ingredient_id: number;
  quantity: number;
  unit: string;
  category: string;
  status: string;
  ingredient: Ingredient;
}

// Common API Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface RecipeFilterParams extends PaginationParams {
  name?: string;
  category?: string;
  dietary_tags?: string[];
  max_prep_time?: number;
  min_calories?: number;
  max_calories?: number;
}

export type ApiError = {
  message: string;
  status: number;
  details?: unknown;
};
