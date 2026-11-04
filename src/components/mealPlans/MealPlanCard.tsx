import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, Target } from 'lucide-react';
import { MealPlan } from '../../types';
import Card, { CardContent } from '../ui/Card';
import { getLocaleFromLanguage } from '../../utils/i18nUtils';
import { formatDate } from '../../utils/dateUtils';
import { formatMealPlanRange, getMealPlanDayCount } from '../../utils/mealPlanUtils';

interface MealPlanCardProps {
  mealPlan: MealPlan;
  onClick?: () => void;
  isPast?: boolean;
  isCurrent?: boolean;
  // Set when several plans cover the same dates
  variant?: { index: number; total: number };
}

const MealPlanCard: React.FC<MealPlanCardProps> = React.memo(({
  mealPlan,
  onClick,
  isPast = false,
  isCurrent = false,
  variant
}) => {
  const { t, i18n } = useTranslation();
  
  const dayCount = getMealPlanDayCount(mealPlan);
  const locale = getLocaleFromLanguage(i18n.language);

  const CardWrapper = onClick ? 'div' : Link;
  const cardProps = onClick 
    ? { onClick } 
    : { to: `/meal-plans/${mealPlan.id}` };
  
  return (
    <CardWrapper {...cardProps} className={onClick ? '' : 'block'} data-testid="meal-plan-card">
      <Card
        className={`h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer ${isPast ? 'opacity-60 grayscale' : ''} ${isCurrent ? 'ring-2 ring-primary-500' : ''}`}
        hoverable
      >
        <div className="bg-gradient-to-r from-accent-100 to-accent-200 p-3 sm:p-4 rounded-t-lg flex items-center justify-between group-hover:from-accent-200 group-hover:to-accent-300 transition-all duration-300">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-accent-700 mr-2" />
            <span className="font-medium text-accent-900 text-sm sm:text-base">
              {t('mealPlans.card.dayCount', { count: dayCount })}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isCurrent && (
              <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
                {t('mealPlans.card.current')}
              </span>
            )}
            {isPast && (
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700">
                {t('mealPlans.card.finished')}
              </span>
            )}
            <span className="flex items-center text-accent-900 text-sm sm:text-base" title={t('mealPlans.detail.people')}>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent-700 mr-1" aria-hidden="true" />
              {t('mealPlans.card.peopleCount', { count: mealPlan.people_count })}
            </span>
          </div>
        </div>
        
        <CardContent className="p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
          <div>
            <h3 className="font-semibold text-base sm:text-lg text-neutral-900 first-letter:uppercase group-hover:text-primary-700 transition-colors">
              {mealPlan.name || formatMealPlanRange(mealPlan, locale)}
            </h3>
            {mealPlan.name && (
              <div className="text-sm text-neutral-600 first-letter:uppercase">{formatMealPlanRange(mealPlan, locale)}</div>
            )}
            {variant && (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                <span className="rounded-full bg-accent-100 px-2 py-0.5 font-medium text-accent-800">
                  {t('mealPlans.card.variant', { index: variant.index, total: variant.total })}
                </span>
                <span>{t('mealPlans.card.createdOn', { date: formatDate(mealPlan.created_at, locale) })}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-neutral-500 mb-1">{t('mealPlans.card.targetCalories')}</div>
              <div className="font-medium text-sm sm:text-base flex items-center">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-secondary-600" />
                {mealPlan.target_calories} {t('common.cal')}/{t('common.day')}
              </div>
            </div>
          </div>
          
          {mealPlan.dietary_preferences.length > 0 && (
            <div>
              <div className="text-xs sm:text-sm text-neutral-500 mb-2">{t('mealPlans.card.preferences')}</div>
              <div className="flex flex-wrap gap-1">
                {mealPlan.dietary_preferences.slice(0, 3).map((pref) => (
                  <span 
                    key={pref}
                    className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800"
                  >
                    {pref}
                  </span>
                ))}
                {mealPlan.dietary_preferences.length > 3 && (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                    +{mealPlan.dietary_preferences.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  );
});

export default MealPlanCard;
