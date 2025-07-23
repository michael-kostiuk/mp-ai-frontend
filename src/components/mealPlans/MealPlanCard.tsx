import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Target } from 'lucide-react';
import { MealPlan } from '../../types';
import Card, { CardContent } from '../ui/Card';

interface MealPlanCardProps {
  mealPlan: MealPlan;
  onClick?: () => void;
}

const MealPlanCard: React.FC<MealPlanCardProps> = React.memo(({
  mealPlan,
  onClick
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const daysDifference = () => {
    const startDate = new Date(mealPlan.start_date);
    const endDate = new Date(mealPlan.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const CardWrapper = onClick ? 'div' : Link;
  const cardProps = onClick 
    ? { onClick } 
    : { to: `/meal-plans/${mealPlan.id}` };
  
  return (
    <CardWrapper {...cardProps} className={onClick ? '' : 'block'}>
      <Card
        className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer"
        hoverable
      >
        <div className="bg-gradient-to-r from-accent-100 to-accent-200 p-3 sm:p-4 rounded-t-lg flex items-center justify-between group-hover:from-accent-200 group-hover:to-accent-300 transition-all duration-300">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-accent-700 mr-2" />
            <span className="font-medium text-accent-900 text-sm sm:text-base">
              {daysDifference()} Days
            </span>
          </div>
          
          <div className="flex items-center">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent-700 mr-1" />
            <span className="text-accent-900 text-sm sm:text-base">{mealPlan.people_count}</span>
          </div>
        </div>
        
        <CardContent className="p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
          <div>
            <div className="text-xs sm:text-sm text-neutral-500 mb-1">Date Range</div>
            <div className="font-medium text-sm sm:text-base text-neutral-900">
              {formatDate(mealPlan.start_date)} - {formatDate(mealPlan.end_date)}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-neutral-500 mb-1">Target Calories</div>
              <div className="font-medium text-sm sm:text-base flex items-center">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-secondary-600" />
                {mealPlan.target_calories} cal/day
              </div>
            </div>
          </div>
          
          {mealPlan.dietary_preferences.length > 0 && (
            <div>
              <div className="text-xs sm:text-sm text-neutral-500 mb-2">Preferences</div>
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