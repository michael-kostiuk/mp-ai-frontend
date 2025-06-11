// Recipe Types
export interface Recipe {
  id: number;
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
  created_at: string;
  ingredients: RecipeIngredient[];
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
}

export interface RecipeIngredientCreate {
  ingredient_id: number;
  quantity: number;
  unit: string;
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
  details?: any;
};