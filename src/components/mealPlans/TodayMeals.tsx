import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ChefHat, ChevronRight } from 'lucide-react';
import { MealPlan, MealPlanEntry } from '../../types';
import Card, { CardContent } from '../ui/Card';
import { getLocaleFromLanguage } from '../../utils/i18nUtils';

interface TodayMealsProps {
  mealPlan: MealPlan;
  entries: MealPlanEntry[];
  dateKey: string;
  currentMealType: string;
}

const TodayMeals: React.FC<TodayMealsProps> = ({ mealPlan, entries, dateKey, currentMealType }) => {
  const { t, i18n } = useTranslation();

  const formattedDate = new Date(dateKey + 'T00:00:00').toLocaleDateString(getLocaleFromLanguage(i18n.language), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="shadow-xl" padding="none">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900">{t('home.today.title')}</h2>
            <p className="text-sm text-neutral-500 capitalize truncate">{formattedDate}</p>
          </div>
          <Link
            to={`/meal-plans/${mealPlan.id}`}
            className="flex items-center shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            {t('home.today.viewPlan')}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {entries.map((entry) => {
            const isCurrent = entry.meal_type === currentMealType;
            return (
              <Link
                key={entry.id}
                to={`/recipes/${entry.recipe_id}?fromMealPlan=${mealPlan.id}`}
                data-testid={isCurrent ? 'today-meal-current' : 'today-meal'}
                className={`flex items-center gap-3 rounded-lg p-3 transition-all duration-300 group ${
                  isCurrent
                    ? 'bg-primary-50 ring-2 ring-primary-500 shadow-md'
                    : 'bg-neutral-50 hover:bg-neutral-100'
                }`}
              >
                {entry.recipe.image_url ? (
                  <img
                    src={entry.recipe.image_url}
                    alt={entry.recipe.name}
                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                    <ChefHat className="h-6 w-6 text-neutral-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs sm:text-sm font-medium ${isCurrent ? 'text-primary-700' : 'text-primary-600'}`}>
                      {t(`mealPlans.mealTypes.${entry.meal_type}`, entry.meal_type)}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
                        {t('home.today.now')}
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-neutral-900 text-sm sm:text-base line-clamp-2 group-hover:text-primary-700">
                    {entry.recipe.name}
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-500">
                    {entry.recipe.calories * entry.servings} {t('common.cal')}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-400 shrink-0" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayMeals;
