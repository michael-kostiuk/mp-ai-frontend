import React, { useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { ShoppingListItem as ShoppingListItemType } from '../../types';

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onStatusChange?: (itemId: number, status: string) => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({
  item,
  onStatusChange
}) => {
  const [isChecked, setIsChecked] = useState(item.status === 'completed');
  
  const handleToggle = () => {
    const newStatus = isChecked ? 'pending' : 'completed';
    setIsChecked(!isChecked);
    if (onStatusChange) {
      onStatusChange(item.id, newStatus);
    }
  };
  
  const getCategoryIcon = () => {
    return <ShoppingBag className="h-4 w-4 text-neutral-400" />;
  };
  
  return (
    <div className={`
      flex items-center p-3 rounded-md transition-colors
      ${isChecked ? 'bg-neutral-50' : 'bg-white hover:bg-neutral-50'}
    `}>
      <button
        type="button"
        className={`
          flex h-5 w-5 items-center justify-center rounded-full border mr-3
          ${isChecked 
            ? 'border-primary-500 bg-primary-500 text-white' 
            : 'border-neutral-300 bg-white'}
        `}
        onClick={handleToggle}
      >
        {isChecked && <Check className="h-3 w-3" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={`
          text-sm font-medium ${isChecked ? 'text-neutral-500 line-through' : 'text-neutral-900'}
        `}>
          {item.quantity} {item.unit} {item.ingredient.name}
        </p>
      </div>
      
      <div className="ml-3 flex items-center">
        <span className={`
          inline-flex items-center rounded-full px-2 py-0.5 text-xs
          ${isChecked ? 'bg-neutral-100 text-neutral-500' : 'bg-neutral-100 text-neutral-700'}
        `}>
          {getCategoryIcon()}
          <span className="ml-1">{item.category}</span>
        </span>
      </div>
    </div>
  );
};

export default ShoppingListItem;