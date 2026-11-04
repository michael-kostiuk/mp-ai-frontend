import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit,
  RefreshCw,
  ShoppingBasket,
  ShoppingCart,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { MealPlan, MealPlanEntry, ShoppingList } from '../../types';
import Button from '../ui/Button';
import MoreMenu from '../ui/MoreMenu';
import Container from '../layout/Container';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Loader from '../ui/Loader';
import ErrorMessage from '../ui/ErrorMessage';
import useApi from '../../hooks/useApi';
import useCachedApi from '../../hooks/useCachedApi';
import { getMealPlan, getMealPlans, deleteMealPlan, generateShoppingList, regenerateMealPlan } from '../../api/mealPlanApi';
import { getMealPlanShoppingLists } from '../../api/shoppingListApi';
import { getLocaleFromLanguage } from '../../utils/i18nUtils';
import { formatDate, formatDateRange, formatDayHeading } from '../../utils/dateUtils';
import { getMealPlanDayCount, getPlanVersions, toDateKey } from '../../utils/mealPlanUtils';
import { getListProgress } from '../../utils/shoppingListUtils';
import { useAuth } from '../../context/AuthContext';
import DemoEditHint from '../auth/DemoEditHint';
import RecipeImagePlaceholder from '../recipes/RecipeImagePlaceholder';

interface MealPlanDetailViewProps {
  onClose: () => void;
  mealPlanId: number | null;
  onEdit?: (mealPlan: MealPlan) => void;
  onDelete?: () => void;
}

const MEAL_TYPE_ORDER: Record<string, number> = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };

const MealPlanDetailView: React.FC<MealPlanDetailViewProps> = ({
  onClose,
  mealPlanId,
  onEdit,
  onDelete
}) => {
  const { t, i18n } = useTranslation();
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [showPastDays, setShowPastDays] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Set when the plan was just generated and saved together with its shopping list
  const justCreated = new URLSearchParams(location.search).get('listReady') === '1';
  const { mode } = useAuth();
  const canEdit = mode === 'owner';
  const locale = getLocaleFromLanguage(i18n.language);
  const todayKey = toDateKey(new Date());

  const { data: mealPlan, loading, error, execute: fetchMealPlan } = useCachedApi<MealPlan, [number]>('mealPlan', getMealPlan, {
    initialArgs: mealPlanId ? [mealPlanId] : undefined
  });
  const { data: allPlans, execute: fetchAllPlans } = useCachedApi<MealPlan[], []>('mealPlans', getMealPlans, { initialArgs: [] });
  const { loading: deleting, execute: deletePlan } = useApi(deleteMealPlan);
  const { loading: generatingList, execute: generateList } = useApi<ShoppingList>(generateShoppingList);
  const {
    loading: loadingShoppingLists,
    execute: fetchShoppingLists,
    cancel: cancelShoppingLists
  } = useApi<ShoppingList[], [number]>(getMealPlanShoppingLists);
  const { loading: regenerating, execute: regenerate } = useApi<MealPlan>(regenerateMealPlan);

  const loadMealPlan = useCallback(() => {
    if (mealPlanId) {
      fetchMealPlan(mealPlanId);
    }
  }, [fetchMealPlan, mealPlanId]);

  useEffect(() => {
    loadMealPlan();
  }, [loadMealPlan]);

  useEffect(() => {
    fetchAllPlans().catch(() => undefined); // only used for the "other versions" links
  }, [fetchAllPlans]);

  const loadShoppingList = useCallback(async () => {
    if (!mealPlanId) return;

    try {
      // Newest first from the API
      const lists = await fetchShoppingLists(mealPlanId);
      setShoppingList(lists[0] ?? null);
    } catch {
      // Non-blocking: the plan works without its shopping list summary
      setShoppingList(null);
    }
  }, [mealPlanId, fetchShoppingLists]);

  useEffect(() => {
    setShoppingList(null);
    loadShoppingList();
    return cancelShoppingLists;
  }, [loadShoppingList, cancelShoppingLists]);

  const days = mealPlan ? getMealPlanDayCount(mealPlan) : 0;

  const caloriesPerDayPerPerson = useMemo(() => {
    if (!mealPlan || days === 0) return 0;
    const total = mealPlan.entries.reduce((sum, entry) => sum + entry.recipe.calories * entry.servings, 0);
    return Math.round(total / (days * Math.max(mealPlan.people_count, 1)));
  }, [mealPlan, days]);

  const dayGroups = useMemo(() => {
    if (!mealPlan) return [];
    const groups: Record<string, MealPlanEntry[]> = {};
    mealPlan.entries.forEach((entry) => {
      (groups[entry.date.slice(0, 10)] ||= []).push(entry);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, entries]) => ({
        date,
        entries: [...entries].sort((a, b) => (MEAL_TYPE_ORDER[a.meal_type] || 5) - (MEAL_TYPE_ORDER[b.meal_type] || 5)),
      }));
  }, [mealPlan]);
  // Days already gone fold away while the plan still runs, so today is the first thing shown
  const planRunning = dayGroups.some(({ date }) => date >= todayKey);
  const pastDays = planRunning ? dayGroups.filter(({ date }) => date < todayKey) : [];
  const shownDays = planRunning ? dayGroups.filter(({ date }) => date >= todayKey) : dayGroups;

  const versions = useMemo(
    () => (mealPlan && allPlans ? getPlanVersions(allPlans, mealPlan) : []),
    [allPlans, mealPlan]
  );

  const listProgress = shoppingList ? getListProgress(shoppingList.items) : null;

  const handleDelete = async () => {
    if (!mealPlanId || !window.confirm(t('mealPlans.deleteConfirm'))) return;

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
      setShoppingList(await generateList(mealPlanId));
    } catch (error) {
      console.error('Failed to generate shopping list:', error);
    }
  };

  // All meals change, so the shopping list is made again together with the plan
  const handleRegenerate = async () => {
    if (!mealPlanId || regenerating || !window.confirm(t('mealPlans.detail.regenerateConfirm'))) return;

    try {
      await regenerate(mealPlanId);
      loadMealPlan();
      await handleGenerateShoppingList();
    } catch (error) {
      console.error('Failed to regenerate meal plan:', error);
    }
  };

  const renderEntry = (entry: MealPlanEntry) => (
    <div key={entry.id} className="flex flex-col rounded-lg bg-neutral-50">
      <button
        type="button"
        onClick={() => navigate(`/recipes/${entry.recipe.id}?fromMealPlan=${mealPlanId}`)}
        className="group flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-neutral-100 transition-colors"
      >
        {entry.recipe.image_url ? (
          <img
            src={entry.recipe.image_url}
            alt=""
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <RecipeImagePlaceholder category={entry.recipe.category} className="h-16 w-16 shrink-0 rounded-lg" iconClassName="h-6 w-6" />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-medium text-primary-600">
              {t(`mealPlans.mealTypes.${entry.meal_type}`, entry.meal_type)}
            </span>
            {entry.is_leftover && (
              <span className="text-xs font-medium text-amber-700 bg-amber-100 rounded px-2 py-0.5">
                {t('mealPlans.leftover')}
              </span>
            )}
          </span>
          <span className="block font-medium text-neutral-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
            {entry.recipe.name}
          </span>
          <span className="block text-sm text-neutral-500">
            {t('mealPlans.detail.entrySummary', {
              servings: t('common.servingsCount', { count: entry.servings }),
              perServing: Math.round(entry.recipe.calories),
            })}
          </span>
        </span>
      </button>
    </div>
  );

  const renderDay = ({ date, entries }: { date: string; entries: MealPlanEntry[] }) => {
    const isToday = date === todayKey;
    const isPastDay = date < todayKey;
    return (
      <div
        key={date}
        className={`bg-white border rounded-lg p-3 sm:p-4 ${
          isToday ? 'border-primary-500 ring-2 ring-primary-500' : 'border-neutral-200'
        } ${isPastDay ? 'opacity-70' : ''}`}
      >
        <h4 className="flex items-center gap-2 font-medium text-neutral-900 pb-3 mb-3 border-b border-neutral-200">
          <span className="first-letter:uppercase">{formatDayHeading(date, locale)}</span>
          {isToday && (
            <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
              {t('mealPlans.detail.today')}
            </span>
          )}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {entries.map(renderEntry)}
        </div>
      </div>
    );
  };

  return (
    <Container className="py-6 sm:py-8 lg:py-12">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onClose}
          className="hidden lg:inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('common.back')}
        </button>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl mb-6 first-letter:uppercase">
          {mealPlan ? mealPlan.name || formatDateRange(mealPlan.start_date, mealPlan.end_date, locale) : t('mealPlans.mealPlanDetails')}
        </h1>
        {mealPlan?.name && (
          <p className="-mt-4 mb-6 text-neutral-600 first-letter:uppercase">
            {formatDateRange(mealPlan.start_date, mealPlan.end_date, locale)}
          </p>
        )}

        <div>
          {loading && !mealPlan && (
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
              {/* Shopping list first: it is what the plan is turned into */}
              <Card padding="none">
                <CardContent className="p-4">
                  {justCreated && shoppingList && (
                    <p className="mb-3 flex items-center gap-2 text-sm font-medium text-success-700">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      {t('mealPlans.detail.listReady')}
                    </p>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-6 w-6 shrink-0 text-primary-600" aria-hidden="true" />
                      <div>
                        <div className="font-medium text-neutral-900">{t('mealPlans.detail.shoppingList')}</div>
                        <div className="text-sm text-neutral-500">
                          {listProgress
                            ? t('mealPlans.detail.listProgress', { bought: listProgress.bought, total: listProgress.total })
                            : loadingShoppingLists
                              ? t('shoppingLists.loadingShoppingLists')
                              : t('mealPlans.detail.noListYet')}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {shoppingList ? (
                        <>
                          <Link to={`/shopping-lists/${shoppingList.id}?store=1`} className="flex-1 sm:flex-none">
                            <Button leftIcon={<ShoppingBasket className="h-4 w-4" />} fullWidth>
                              {t('shoppingLists.storeMode.open')}
                            </Button>
                          </Link>
                          <Link to={`/shopping-lists/${shoppingList.id}`} className="flex-1 sm:flex-none">
                            <Button variant="outline" fullWidth>
                              {t('mealPlans.detail.openShoppingList')}
                            </Button>
                          </Link>
                        </>
                      ) : (
                        !loadingShoppingLists && (
                          <Button
                            onClick={handleGenerateShoppingList}
                            isLoading={generatingList}
                            leftIcon={<ShoppingCart className="h-4 w-4" />}
                            className="w-full sm:w-auto"
                          >
                            {t('mealPlans.detail.generateList')}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meal Schedule */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-neutral-900">{t('mealPlans.detail.mealSchedule')}</h2>
                {dayGroups.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    {t('mealPlans.noMealsScheduled')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastDays.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowPastDays(!showPastDays)}
                          aria-expanded={showPastDays}
                          className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                        >
                          {t('mealPlans.detail.pastDays', { count: pastDays.length })}
                          <ChevronDown className={`h-4 w-4 transition-transform ${showPastDays ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>
                        {showPastDays && <div className="mt-4 space-y-4">{pastDays.map(renderDay)}</div>}
                      </div>
                    )}
                    {shownDays.map(renderDay)}
                  </div>
                )}
              </div>

              {/* Header Info */}
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                {[
                  { icon: <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary-600 mx-auto mb-2" />, value: days, label: t('mealPlans.detail.days') },
                  { icon: <Users className="h-6 w-6 md:h-8 md:w-8 text-accent-600 mx-auto mb-2" />, value: mealPlan.people_count, label: t('mealPlans.detail.people') },
                  { icon: <Target className="h-6 w-6 md:h-8 md:w-8 text-secondary-600 mx-auto mb-2" />, value: mealPlan.target_calories, label: t('mealPlans.detail.targetCalDay') },
                  { icon: <Clock className="h-6 w-6 md:h-8 md:w-8 text-warning-600 mx-auto mb-2" />, value: caloriesPerDayPerPerson, label: t('mealPlans.detail.actualCalDay') },
                ].map((stat) => (
                  <Card key={stat.label} padding="none">
                    <CardContent className="px-1 py-3 md:p-6 text-center">
                      {stat.icon}
                      <div className="text-lg md:text-2xl font-bold text-neutral-900">{stat.value}</div>
                      <div className="text-xs md:text-sm leading-tight text-neutral-500">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Warn when the meals are far from the calorie goal (more than 10% either way) */}
              {(() => {
                const actual = caloriesPerDayPerPerson;
                const target = mealPlan.target_calories;
                if (!target || !actual || Math.abs(actual - target) <= target * 0.1) return null;
                return (
                  <div className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800" role="status">
                    <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-medium">
                        {t(actual < target ? 'mealPlans.detail.caloriesBelowTarget' : 'mealPlans.detail.caloriesAboveTarget', {
                          actual,
                          target,
                          difference: Math.abs(target - actual),
                        })}
                      </p>
                      <p className="mt-1">{t('mealPlans.detail.caloriesHint')}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="text-center text-sm text-neutral-500">
                {t('mealPlans.detail.createdOn')} {formatDate(mealPlan.created_at, locale)}
                {versions.length > 1 && (
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2">
                    <span>{t('mealPlans.detail.versionOf', { index: versions.findIndex((v) => v.id === mealPlan.id) + 1, total: versions.length })}</span>
                    {versions.map((version, i) =>
                      version.id === mealPlan.id ? null : (
                        <Link key={version.id} to={`/meal-plans/${version.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                          {t('mealPlans.detail.openVersion', { index: i + 1 })}
                        </Link>
                      )
                    )}
                  </div>
                )}
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

              {/* Actions */}
              {!canEdit && <DemoEditHint />}
              {canEdit && (
                <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-neutral-200">
                  {onEdit && (
                    <Button
                      onClick={() => onEdit(mealPlan)}
                      leftIcon={<Edit className="h-4 w-4" />}
                      className="flex-1 sm:flex-none"
                    >
                      {t('mealPlans.detail.editPlan')}
                    </Button>
                  )}
                  <MoreMenu
                    placement="up"
                    items={[
                      {
                        label: regenerating ? t('common.loading') : t('mealPlans.detail.regenerate'),
                        icon: <RefreshCw className="h-4 w-4" />,
                        onClick: handleRegenerate,
                      },
                      {
                        label: deleting ? t('common.loading') : t('mealPlans.deletePlan'),
                        icon: <Trash2 className="h-4 w-4" />,
                        onClick: handleDelete,
                        danger: true,
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </Container>
  );
};

export default MealPlanDetailView;
