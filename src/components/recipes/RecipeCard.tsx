import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Tag } from 'lucide-react';
import { Recipe } from '../../types';
import Card, { CardContent } from '../ui/Card';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = React.memo(({ recipe, onClick }) => {
  const totalTime = recipe.prep_time + recipe.cook_time;
  
  const CardWrapper = onClick ? 'div' : Link;
  const cardProps = onClick 
    ? { onClick } 
    : { to: `/recipes/${recipe.id}` };
  
  return (
    <CardWrapper {...cardProps} className={onClick ? '' : 'block'}>
      <Card 
        className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer"
        hoverable
      >
        <div className="relative">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-32 sm:h-40 lg:h-48 object-cover rounded-t-lg"
            />
          ) : (
            <div className="bg-gradient-to-br from-secondary-100 to-secondary-200 h-32 sm:h-40 lg:h-48 rounded-t-lg flex items-center justify-center group-hover:from-secondary-200 group-hover:to-secondary-300 transition-all duration-300">
              <span className="text-3xl sm:text-4xl lg:text-5xl group-hover:scale-110 transition-transform duration-300">🍲</span>
            </div>
          )}
          
          {/* Category badge */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-medium text-neutral-700 shadow-sm">
              {recipe.category}
            </span>
          </div>
        </div>
        
        <CardContent className="p-3 sm:p-4 lg:p-5">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-primary-700 transition-colors">
            {recipe.name}
          </h3>
          
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
            {(recipe.dietary_tags || []).slice(0, 2).map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800"
              >
                <Tag className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {tag}
              </span>
            ))}
            {(recipe.dietary_tags || []).length > 2 && (
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                +{(recipe.dietary_tags || []).length - 2}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-500">
            <div className="flex items-center justify-center sm:justify-start">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="truncate">{totalTime}m</span>
            </div>
            
            <div className="flex items-center justify-center">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span>{recipe.servings}</span>
            </div>
            
            <div className="flex items-center justify-center sm:justify-end">
              <span className="font-medium">{recipe.calories}</span>
              <span className="ml-1 hidden sm:inline">cal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  );
});

export default RecipeCard;
