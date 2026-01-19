import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, Calendar, Users, Target, Clock, ShoppingCart, Edit, Trash2 } from 'lucide-react';
import { MealPlan, ShoppingList } from '../../types';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Loader from '../ui/Loader';
import ErrorMessage from '../ui/ErrorMessage';
import useApi from '../../hooks/useApi';
import { getMealPlan, deleteMealPlan, generateShoppingList } from '../../api/mealPlanApi';

interface MealPlanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealPlanId: number | null;
  onEdit?: (mealPlan: MealPlan) => void;
  onDelete?: () => void;
}

const MealPlanDetailModal: React.FC<MealPlanDetailModalProps> = ({
  isOpen,
  onClose,
  mealPlanId,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { data: mealPlan, loading, error, execute: fetchMealPlan } = useApi<MealPlan>(getMealPlan);
  const { loading: deleting, execute: deletePlan } = useApi(deleteMealPlan);
  const { data: shoppingList, loading: generatingList, execute: generateList } = useApi<ShoppingList>(generateShoppingList);

  // Memoize the fetch function to prevent unnecessary re-renders
  const loadMealPlan = useCallback(() => {
    if (mealPlanId) {
      fetchMealPlan(mealPlanId);
    }
  }, [fetchMealPlan, mealPlanId]);

  // Load meal plan only when modal opens or mealPlanId changes
  useEffect(() => {
    if (isOpen && mealPlanId) {
      loadMealPlan();
    }
  }, [isOpen, mealPlanId, loadMealPlan]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysDifference = () => {
    if (!mealPlan) return 0;
    const startDate = new Date(mealPlan.start_date);
    const endDate = new Date(mealPlan.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getTotalCalories = () => {
    if (!mealPlan) return 0;
    return mealPlan.entries.reduce((total, entry) => {
      return total + (entry.recipe.calories * entry.servings);
    }, 0);
  };

  const getCaloriesPerDay = () => {
    const days = getDaysDifference();
    return days > 0 ? Math.round(getTotalCalories() / days) : 0;
  };

  const groupEntriesByDate = () => {
    if (!mealPlan) return {};
    
    return mealPlan.entries.reduce((groups, entry) => {
      const date = entry.date.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    }, {} as Record<string, typeof mealPlan.entries>);
  };

  // Define meal type order for sorting
  const getMealTypeOrder = (mealType: string): number => {
    const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
    return order[mealType as keyof typeof order] || 5;
  };

  const handleDelete = async () => {
    if (!mealPlanId) return;
    
    try {
      await deletePlan(mealPlanId);
      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete meal plan:', error);
    }
  };

  const handleGenerateShoppingList = async () => {
    if (!mealPlanId) return;
    
    try {
      await generateList(mealPlanId);
    } catch (error) {
      console.error('Failed to generate shopping list:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Meal Plan Details</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="py-12">
              <Loader centered label="Loading meal plan..." />
            </div>
          )}

          {error && (
            <ErrorMessage 
              title="Failed to load meal plan" 
              message={error.message}
              onRetry={loadMealPlan} 
            />
          )}

          {mealPlan && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-neutral-900">{getDaysDifference()}</div>
                    <div className="text-sm text-neutral-500">Days</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-accent-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-neutral-900">{mealPlan.people_count}</div>
                    <div className="text-sm text-neutral-500">People</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-neutral-900">{mealPlan.target_calories}</div>
                    <div className="text-sm text-neutral-500">Target Cal/Day</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 text-warning-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-neutral-900">{getCaloriesPerDay()}</div>
                    <div className="text-sm text-neutral-500">Actual Cal/Day</div>
                  </CardContent>
                </Card>
              </div>

              {/* Date Range */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-lg font-medium text-neutral-900 mb-1">
                      {formatDate(mealPlan.start_date)} - {formatDate(mealPlan.end_date)}
                    </div>
                    <div className="text-sm text-neutral-500">
                      Created on {formatDate(mealPlan.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dietary Preferences */}
              {mealPlan.dietary_preferences.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dietary Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {mealPlan.dietary_preferences.map((pref) => (
                        <span 
                          key={pref}
                          className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meal Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Meal Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(groupEntriesByDate()).length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      No meals scheduled for this plan.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupEntriesByDate())
                        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                        .map(([date, entries]) => (
                          <div key={date}>
                            <h4 className="font-medium text-neutral-900 mb-3">
                              {formatDate(date + 'T00:00:00')}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {entries
                                .sort((a, b) => getMealTypeOrder(a.meal_type) - getMealTypeOrder(b.meal_type))
                                .map((entry) => (
                                  <div key={entry.id} className="bg-neutral-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-primary-600 capitalize">
                                        {entry.meal_type}
                                      </span>
                                      <span className="text-sm text-neutral-500">
                                        {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <Link
                                      to={`/recipes/${entry.recipe.id}?fromMealPlan=${mealPlan.id}`}
                                      className="font-medium text-neutral-900 mb-1 block hover:text-primary-700 transition-colors"
                                    >
                                      {entry.recipe.name}
                                    </Link>
                                    <div className="text-sm text-neutral-500">
                                      {entry.recipe.calories * entry.servings} calories
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shopping List Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Shopping List</CardTitle>
                    <Button
                      onClick={handleGenerateShoppingList}
                      isLoading={generatingList}
                      leftIcon={<ShoppingCart className="h-4 w-4" />}
                      size="sm"
                    >
                      Generate List
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {shoppingList ? (
                    <div className="space-y-2">
                      <div className="text-sm text-success-600 mb-4">
                        ✓ Shopping list generated with {shoppingList.items.length} items
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shoppingList.items.slice(0, 6).map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                            <span className="text-sm">{item.ingredient.name}</span>
                            <span className="text-sm text-neutral-500">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                      {shoppingList.items.length > 6 && (
                        <div className="text-sm text-neutral-500 text-center mt-2">
                          +{shoppingList.items.length - 6} more items
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-500">
                      Generate a shopping list to see all required ingredients.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-between pt-6 border-t border-neutral-200">
                <div>
                  {!showDeleteConfirm ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      className="text-error-600 border-error-300 hover:bg-error-50"
                    >
                      Delete Plan
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                        isLoading={deleting}
                        className="text-error-600 border-error-300 hover:bg-error-50"
                      >
                        Confirm Delete
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  {onEdit && (
                    <Button
                      onClick={() => onEdit(mealPlan)}
                      leftIcon={<Edit className="h-4 w-4" />}
                    >
                      Edit Plan
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealPlanDetailModal;
