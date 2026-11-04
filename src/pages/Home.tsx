import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import Container from '../components/layout/Container';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import TodayMeals from '../components/mealPlans/TodayMeals';
import { findTodayPlan, getCurrentMeal } from '../utils/mealPlanUtils';
import { MealPlan } from '../types';
import useCachedApi from '../hooks/useCachedApi';
import { getMealPlans } from '../api/mealPlanApi';

// Home is today's menu only, the same on phones and computers; the sections are in the
// header menu (computer) or the bottom tab bar (phone)
const Home: React.FC = () => {
  const { t } = useTranslation();
  const { data: mealPlans, loading: loadingMealPlans, execute: fetchMealPlans } = useCachedApi<MealPlan[], []>('mealPlans', getMealPlans, { initialArgs: [] });

  useEffect(() => {
    fetchMealPlans().catch(() => {
      // Today's plan is optional on the home page; ignore load failures
    });
  }, [fetchMealPlans]);

  const currentMeal = getCurrentMeal(new Date());
  const today = mealPlans ? findTodayPlan(mealPlans, currentMeal.dateKey) : null;
  const waitingForPlans = mealPlans === null && loadingMealPlans;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="pt-6 pb-6 sm:pt-10 sm:pb-8">
        <Container>
          <h1 className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold tracking-[-0.035em] text-neutral-900">
            {t('home.title')}
          </h1>
        </Container>
      </div>

      <Container maxWidth="5xl">
        {waitingForPlans && (
          <Card padding="none">
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {today && (
          <TodayMeals
            mealPlan={today.mealPlan}
            entries={today.entries}
            dateKey={currentMeal.dateKey}
            currentMealType={currentMeal.mealType}
          />
        )}

        {!waitingForPlans && !today && (
          <Card className="py-10 text-center">
            <CardContent>
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-neutral-300" aria-hidden="true" />
              <p className="mb-4 text-neutral-600">{t('home.today.noPlan')}</p>
              <Link to="/meal-plans">
                <Button>{t('mealPlans.createMealPlan')}</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default Home;
