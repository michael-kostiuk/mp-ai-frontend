import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, Users, Target, Clock, ShoppingCart, Edit, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { MealPlan, ShoppingList } from '../../types';
import Button from '../ui/Button';
import Container from '../layout/Container';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Loader from '../ui/Loader';
import ErrorMessage from '../ui/ErrorMessage';
import useApi from '../../hooks/useApi';
import useCachedApi from '../../hooks/useCachedApi';
import { getMealPlan, deleteMealPlan, generateShoppingList, regenerateMealPlan } from '../../api/mealPlanApi';
import { getMealPlanShoppingLists } from '../../api/shoppingListApi';
import { getLocaleFromLanguage } from '../../utils/i18nUtils';

interface MealPlanDetailViewProps {
  onClose: () => void;
  mealPlanId: number | null;
  onEdit?: (mealPlan: MealPlan) => void;
  onDelete?: () => void;
}

const MealPlanDetailView: React.FC<MealPlanDetailViewProps> = ({
  onClose,
  mealPlanId,
  onEdit,
  onDelete
}) => {
  const { t, i18n } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [existingShoppingList, setExistingShoppingList] = useState<ShoppingList | null>(null);
  const navigate = useNavigate();
  
  const { data: mealPlan, loading, error, execute: fetchMealPlan } = useCachedApi<MealPlan, [number]>('mealPlan', getMealPlan, {
    initialArgs: mealPlanId ? [mealPlanId] : undefined
  });
  const { loading: deleting, execute: deletePlan } = useApi(deleteMealPlan);
  const { data: shoppingList, loading: generatingList, execute: generateList } = useApi<ShoppingList>(generateShoppingList);
  const {
    loading: loadingShoppingLists,
    execute: fetchShoppingLists,
    cancel: cancelShoppingLists
  } = useApi<ShoppingList[], [number]>(getMealPlanShoppingLists);
  const { loading: regenerating, execute: regenerate } = useApi<MealPlan>(regenerateMealPlan);

  // Memoize the fetch function to prevent unnecessary re-renders
  const loadMealPlan = useCallback(() => {
    if (mealPlanId) {
      fetchMealPlan(mealPlanId);
    }
  }, [fetchMealPlan, mealPlanId]);

  useEffect(() => {
    loadMealPlan();
  }, [loadMealPlan]);

  const loadExistingShoppingList = useCallback(async () => {
    if (!mealPlanId) return;

    try {
      // Newest first from the API
      const lists = await fetchShoppingLists(mealPlanId);
      setExistingShoppingList(lists[0] ?? null);
    } catch {
      // Non-blocking: shopping list summary is optional in this modal.
      setExistingShoppingList(null);
    }
  }, [mealPlanId, fetchShoppingLists]);

  useEffect(() => {
    setExistingShoppingList(null);
    loadExistingShoppingList();
    return cancelShoppingLists;
  }, [loadExistingShoppingList, cancelShoppingLists]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(getLocaleFromLanguage(i18n.language), { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // e.g. "Mo 12.10.26"
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString.slice(0, 10) + 'T00:00:00');
    const weekday = date.toLocaleDateString(getLocaleFromLanguage(i18n.language), { weekday: 'short' }).slice(0, 2);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${String(date.getFullYear()).slice(-2)}`;
  };

  const getDaysDifference = () => {
    if (!mealPlan) return 0;
    const startDate = new Date(mealPlan.start_date);
    const endDate = new Date(mealPlan.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getTotalPlanCalories = () => {
    if (!mealPlan) return 0;
    return mealPlan.entries.reduce((total, entry) => {
      return total + (entry.recipe.calories * entry.servings);
    }, 0);
  };

  const getCaloriesPerDayPerPerson = () => {
    if (!mealPlan) return 0;
    const days = getDaysDifference();
    const people = Math.max(mealPlan.people_count, 1);
    return days > 0 ? Math.round(getTotalPlanCalories() / (days * people)) : 0;
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
       const created = await generateList(mealPlanId);
       setExistingShoppingList(created);
     } catch (error) {
       console.error('Failed to generate shopping list:', error);
     }
   };

  const handleRegenerate = async () => {
    if (!mealPlanId || regenerating) return;
    
    try {
      await regenerate(mealPlanId);
      // Refresh the meal plan data after regeneration
      loadMealPlan();
    } catch (error) {
      console.error('Failed to regenerate meal plan:', error);
    }
  };

  return (
    <Container className="py-6 sm:py-8 lg:py-12">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onClose}
          className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('common.back')}
        </button>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl mb-6">{t('mealPlans.mealPlanDetails')}</h1>

        <div>
          {loading && (
            <div className="py-12">
              <Loader centered label={t('mealPlans.loadingMealPlan')} />
            </div>
          )}

          {error && (
            <ErrorMessage 
              title={t('mealPlans.failedToLoad')} 
              message={error.message}
              onRetry={loadMealPlan} 
            />
          )}

          {mealPlan && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                <Card padding="none">
                  <CardContent className="px-1 py-3 md:p-9 text-center">
                    <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary-600 mx-auto mb-2" />
                    <div className="text-lg md:text-2xl font-bold text-neutral-900">{getDaysDifference()}</div>
                    <div className="text-xs md:text-sm leading-tight text-neutral-500">{t('mealPlans.detail.days')}</div>
                  </CardContent>
                </Card>

                <Card padding="none">
                  <CardContent className="px-1 py-3 md:p-9 text-center">
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-accent-600 mx-auto mb-2" />
                    <div className="text-lg md:text-2xl font-bold text-neutral-900">{mealPlan.people_count}</div>
                    <div className="text-xs md:text-sm leading-tight text-neutral-500">{t('mealPlans.detail.people')}</div>
                  </CardContent>
                </Card>

                <Card padding="none">
                  <CardContent className="px-1 py-3 md:p-9 text-center">
                    <Target className="h-6 w-6 md:h-8 md:w-8 text-secondary-600 mx-auto mb-2" />
                    <div className="text-lg md:text-2xl font-bold text-neutral-900">{mealPlan.target_calories}</div>
                    <div className="text-xs md:text-sm leading-tight text-neutral-500">{t('mealPlans.detail.targetCalDay')}</div>
                  </CardContent>
                </Card>

                <Card padding="none">
                  <CardContent className="px-1 py-3 md:p-9 text-center">
                    <Clock className="h-6 w-6 md:h-8 md:w-8 text-warning-600 mx-auto mb-2" />
                    <div className="text-lg md:text-2xl font-bold text-neutral-900">{getCaloriesPerDayPerPerson()}</div>
                    <div className="text-xs md:text-sm leading-tight text-neutral-500">{t('mealPlans.detail.actualCalDay')}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Date Range */}
              <div>
                <CardContent>
                  <div className="text-center">
                    <div className="text-lg font-medium text-neutral-900 mb-1">
                      {formatShortDate(mealPlan.start_date)} - {formatShortDate(mealPlan.end_date)}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {t('mealPlans.detail.createdOn')} {formatDate(mealPlan.created_at)}
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Dietary Preferences */}
              {mealPlan.dietary_preferences.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('mealPlans.detail.dietaryPreferences')}</CardTitle>
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
              <div>
                <CardHeader>
                  <CardTitle>{t('mealPlans.detail.mealSchedule')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(groupEntriesByDate()).length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      {t('mealPlans.noMealsScheduled')}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupEntriesByDate())
                        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                        .map(([date, entries]) => (
                          <div key={date} className="bg-white border border-neutral-200 rounded-lg p-3 sm:p-4">
                            <h4 className="font-medium text-neutral-900 pb-3 mb-3 border-b border-neutral-200">
                              {formatDate(date + 'T00:00:00')}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {entries
                                .sort((a, b) => getMealTypeOrder(a.meal_type) - getMealTypeOrder(b.meal_type))
                                .map((entry) => (
                                  <button
                                    type="button"
                                    key={entry.id}
                                    onClick={() => navigate(`/recipes/${entry.recipe.id}?fromMealPlan=${mealPlanId}`)}
                                    className="group w-full text-left bg-neutral-50 rounded-lg p-4 hover:bg-neutral-100 transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-primary-600 capitalize">
                                        {entry.meal_type}
                                      </span>
                                      <span className="text-sm text-neutral-500">
                                        {entry.is_leftover && (
                                          <span className="mr-2 text-xs font-medium text-amber-700 bg-amber-100 rounded px-2 py-0.5">
                                            {t('mealPlans.leftover')}
                                          </span>
                                        )}
                                        {entry.servings} {entry.servings !== 1 ? t('common.servings') : t('common.serving')}
                                      </span>
                                    </div>
                                    <div className="font-medium text-neutral-900 mb-1 group-hover:text-primary-700 transition-colors">
                                      {entry.recipe.name}
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                      {entry.recipe.calories * entry.servings} {t('common.cal')} ({entry.servings} x {entry.recipe.calories})
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Shopping List Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('mealPlans.detail.shoppingList')}</CardTitle>
                    <div className="flex items-center gap-2">
                      {(shoppingList ?? existingShoppingList) && (
                        <Link to={`/shopping-lists/${(shoppingList ?? existingShoppingList)!.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            rightIcon={<ExternalLink className="h-4 w-4" />}
                          >
                            {t('mealPlans.detail.openShoppingList')}
                          </Button>
                        </Link>
                      )}
                      <Button
                        onClick={handleGenerateShoppingList}
                        isLoading={generatingList}
                        leftIcon={<ShoppingCart className="h-4 w-4" />}
                        size="sm"
                      >
                        {t('mealPlans.detail.generateList')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(shoppingList ?? existingShoppingList) ? (
                    <div className="space-y-2">
                      <div className="text-sm text-success-600 mb-4">
                        ✓ {t('mealPlans.detail.shoppingListGenerated', { count: (shoppingList ?? existingShoppingList)!.items.length })}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(shoppingList ?? existingShoppingList)!.items.slice(0, 6).map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                            <span className="text-sm">{item.ingredient.name}</span>
                            <span className="text-sm text-neutral-500">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                      {(shoppingList ?? existingShoppingList)!.items.length > 6 && (
                        <div className="text-sm text-neutral-500 text-center mt-2">
                          {t('common.moreItems', { count: (shoppingList ?? existingShoppingList)!.items.length - 6 })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-500">
                      {loadingShoppingLists ? t('shoppingLists.loadingShoppingLists') : t('mealPlans.detail.generateShoppingListHint')}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t border-neutral-200">
                {onEdit && (
                  <Button
                    onClick={() => onEdit(mealPlan)}
                    leftIcon={<Edit className="h-4 w-4" />}
                    className="w-full sm:w-auto"
                  >
                    {t('mealPlans.detail.editPlan')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  isLoading={regenerating}
                  disabled={regenerating}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  className="w-full sm:w-auto"
                >
                  {t('mealPlans.detail.regenerate')}
                </Button>
                {!showDeleteConfirm ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    className="w-full sm:w-auto !text-error-600 !border-error-300 hover:!bg-error-50"
                  >
                    {t('mealPlans.deletePlan')}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 sm:flex-none"
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleDelete}
                      isLoading={deleting}
                      className="flex-1 sm:flex-none"
                    >
                      {t('mealPlans.confirmDelete')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default MealPlanDetailView;
