import React from 'react';
import { ChefHat, Coffee, CupSoda, IceCream, Salad, Sandwich, Soup, UtensilsCrossed, type LucideIcon } from 'lucide-react';

// Recipes without a photo get a coloured tile with an icon for their category
const STYLES: Record<string, { icon: LucideIcon; className: string }> = {
  breakfast: { icon: Coffee, className: 'from-amber-100 to-amber-200 text-amber-700' },
  lunch: { icon: Soup, className: 'from-orange-100 to-orange-200 text-orange-700' },
  dinner: { icon: UtensilsCrossed, className: 'from-rose-100 to-rose-200 text-rose-700' },
  dessert: { icon: IceCream, className: 'from-pink-100 to-pink-200 text-pink-700' },
  snack: { icon: Sandwich, className: 'from-yellow-100 to-yellow-200 text-yellow-700' },
  appetizer: { icon: Sandwich, className: 'from-lime-100 to-lime-200 text-lime-700' },
  side: { icon: Salad, className: 'from-green-100 to-green-200 text-green-700' },
  beverage: { icon: CupSoda, className: 'from-sky-100 to-sky-200 text-sky-700' },
};
const DEFAULT_STYLE = { icon: ChefHat, className: 'from-secondary-100 to-secondary-200 text-secondary-700' };

interface RecipeImagePlaceholderProps {
  category?: string;
  className?: string;
  iconClassName?: string;
}

const RecipeImagePlaceholder: React.FC<RecipeImagePlaceholderProps> = ({
  category,
  className = '',
  iconClassName = 'h-12 w-12 sm:h-16 sm:w-16',
}) => {
  const { icon: Icon, className: colors } = STYLES[(category || '').toLowerCase()] ?? DEFAULT_STYLE;
  return (
    <div className={`bg-gradient-to-br ${colors} flex items-center justify-center ${className}`} aria-hidden="true">
      <Icon className={iconClassName} />
    </div>
  );
};

export default RecipeImagePlaceholder;
