import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChefHat, CalendarDays, ShoppingCart, List } from 'lucide-react';
import Container from '../components/layout/Container';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import BrandMark from '../components/ui/BrandMark';
import TodayMeals from '../components/mealPlans/TodayMeals';
import { findTodayPlan, getCurrentMeal } from '../utils/mealPlanUtils';
import { MealPlan } from '../types';
import useApi from '../hooks/useApi';
import { getMealPlans } from '../api/mealPlanApi';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { data: mealPlans, execute: fetchMealPlans } = useApi<MealPlan[]>(getMealPlans);

  useEffect(() => {
    fetchMealPlans().catch(() => {
      // Today's plan is optional on the home page; ignore load failures
    });
  }, [fetchMealPlans]);

  const currentMeal = getCurrentMeal(new Date());
  const today = mealPlans ? findTodayPlan(mealPlans, currentMeal.dateKey) : null;

  const features = [
    {
      title: t('home.features.recipes.title'),
      description: t('home.features.recipes.description'),
      icon: <ChefHat className="h-8 w-8 lg:h-10 lg:w-10 text-primary-600" />,
      link: '/recipes',
      linkText: t('home.features.recipes.linkText'),
    },
    {
      title: t('home.features.mealPlans.title'),
      description: t('home.features.mealPlans.description'),
      icon: <CalendarDays className="h-8 w-8 lg:h-10 lg:w-10 text-accent-500" />,
      link: '/meal-plans',
      linkText: t('home.features.mealPlans.linkText'),
    },
    {
      title: t('home.features.shoppingLists.title'),
      description: t('home.features.shoppingLists.description'),
      icon: <ShoppingCart className="h-8 w-8 lg:h-10 lg:w-10 text-secondary-500" />,
      link: '/shopping-lists',
      linkText: t('home.features.shoppingLists.linkText'),
    },
    {
      title: t('home.features.ingredients.title'),
      description: t('home.features.ingredients.description'),
      icon: <List className="h-8 w-8 lg:h-10 lg:w-10 text-neutral-600" />,
      link: '/ingredients',
      linkText: t('home.features.ingredients.linkText'),
    },
  ];
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className={`${today ? 'pt-6 pb-6 sm:pt-10 sm:pb-8' : 'py-12 sm:py-16 lg:py-20 xl:py-24'}`}>
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <div className={today ? 'hidden' : 'mb-6 sm:mb-8'}>
              <BrandMark className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 mx-auto text-neutral-900" />
            </div>
            <h1 className={`font-bold tracking-[-0.035em] text-neutral-900 ${today ? 'text-2xl sm:text-3xl lg:text-4xl mb-2' : 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl mb-4 sm:mb-6'}`}>
              {t('home.title')}
            </h1>
            <p className={`text-neutral-500 max-w-3xl mx-auto leading-relaxed ${today ? 'hidden sm:block text-base sm:text-lg' : 'text-lg sm:text-xl lg:text-2xl'}`}>
              {t('home.subtitle')}
            </p>
          </div>
        </Container>
      </div>
      
      {today && (
        <Container>
          <TodayMeals
            mealPlan={today.mealPlan}
            entries={today.entries}
            dateKey={currentMeal.dateKey}
            currentMealType={currentMeal.mealType}
          />
        </Container>
      )}

      <Container className="py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="grid grid-cols-4 gap-2 sm:hidden">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.link}>
              <Card padding="none" className="h-full flex flex-col items-center text-center gap-2 px-1 py-3 active:scale-95 transition-transform">
                <div className="p-2 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl">
                  {feature.icon}
                </div>
                <span className="text-xs font-semibold text-neutral-900 leading-tight break-words">{feature.title}</span>
              </Card>
            </Link>
          ))}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-col items-center text-center sm:items-start sm:text-left lg:items-center lg:text-center xl:items-start xl:text-left">
                <div className="mb-4 p-3 sm:p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl">{feature.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6 flex-1 flex flex-col">
                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed flex-1">
                  {feature.description}
                </p>
                
                <div className="mt-auto">
                  <Link to={feature.link}>
                    <Button variant="outline" fullWidth className="group-hover:bg-primary-50 group-hover:border-primary-300 group-hover:text-primary-700 transition-all duration-300">
                      {feature.linkText}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
      </Container>
    </div>
  );
};

export default Home;
