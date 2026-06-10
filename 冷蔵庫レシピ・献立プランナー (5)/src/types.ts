/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FridgeItem {
  id: string;
  name: string;
  category: 'meat' | 'fish' | 'vegetable' | 'dairy' | 'egg' | 'processed' | 'seasoning' | 'other';
  quantity: string;
  addedDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD (optional)
}

export interface IngredientRequired {
  name: string;
  amount: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: number; // in minutes
  difficulty: '簡単' | '普通' | '少し凝っている';
  servingSize: number;
  ingredientsUsed: string[];
  ingredientsRequired: IngredientRequired[];
  steps: string[];
  savingPoints: string[];
  nutritionEstimate?: string;
}

export interface PlannedMeal {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId?: string;
  customTitle?: string; // If user manually adds a planned meal
  recipe?: Recipe; // Combined recipe if present
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
  relatedRecipeId?: string;
}

export type MealPlanPeriod = 'day' | 'week';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'member';
  name: string;
  password?: string; // Persisted locally for auth simulation
  facePhoto?: string; // Base64 representation of face photo for identification comparison
}

export interface RecommendQuickItem {
  name: string;
  category: FridgeItem['category'];
  quantity: string;
  shelfLife: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: string;
  read: boolean;
}

