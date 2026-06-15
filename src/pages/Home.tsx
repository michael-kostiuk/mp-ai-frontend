import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChefHat, CalendarDays, ShoppingCart, List } from 'lucide-react';
import Container from '../components/layout/Container';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';

const Home: React.FC = () => {
  const { t } = useTranslation();
  
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
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 py-12 sm:py-16 lg:py-20 xl:py-24 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <Container className="relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 sm:mb-8">
              <ChefHat className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 mx-auto mb-4 sm:mb-6 text-white/90" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6">
              {t('home.title')}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {t('home.subtitle')}
            </p>
          </div>
        </Container>
      </div>
      
      <Container className="py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
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
