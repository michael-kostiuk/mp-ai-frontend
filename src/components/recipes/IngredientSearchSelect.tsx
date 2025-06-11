import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Ingredient } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import useApi from '../../hooks/useApi';
import { getIngredients } from '../../api/ingredientApi';

interface IngredientSearchSelectProps {
  value: number;
  onChange: (ingredientId: number) => void;
  onCreateNew?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const IngredientSearchSelect: React.FC<IngredientSearchSelectProps> = ({
  value,
  onChange,
  onCreateNew,
  placeholder = "Search ingredients...",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: ingredients, loading, execute: searchIngredients } = useApi<Ingredient[]>(getIngredients);

  // Search ingredients when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchIngredients({ name: searchQuery.trim() });
    } else if (isOpen) {
      searchIngredients();
    }
  }, [searchQuery, isOpen, searchIngredients]);

  // Find selected ingredient when value changes
  useEffect(() => {
    if (value && ingredients) {
      const ingredient = ingredients.find(ing => ing.id === value);
      setSelectedIngredient(ingredient || null);
      if (ingredient) {
        setSearchQuery(ingredient.name);
      }
    } else {
      setSelectedIngredient(null);
      if (!isOpen) {
        setSearchQuery('');
      }
    }
  }, [value, ingredients, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search query to selected ingredient name if closed without selection
        if (selectedIngredient) {
          setSearchQuery(selectedIngredient.name);
        } else {
          setSearchQuery('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedIngredient]);

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setSearchQuery(ingredient.name);
    onChange(ingredient.id);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    if (onCreateNew && searchQuery.trim()) {
      onCreateNew(searchQuery.trim());
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedIngredient(null);
    setSearchQuery('');
    onChange(0);
    inputRef.current?.focus();
  };

  const filteredIngredients = ingredients || [];
  const hasExactMatch = filteredIngredients.some(
    ing => ing.name.toLowerCase() === searchQuery.toLowerCase()
  );
  const showCreateOption = searchQuery.trim() && !hasExactMatch && onCreateNew;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={
            selectedIngredient ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            ) : undefined
          }
          disabled={disabled}
          fullWidth
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-neutral-500 text-center">
              Searching ingredients...
            </div>
          )}

          {!loading && filteredIngredients.length === 0 && !showCreateOption && (
            <div className="px-3 py-2 text-sm text-neutral-500 text-center">
              No ingredients found
            </div>
          )}

          {!loading && filteredIngredients.map((ingredient) => (
            <button
              key={ingredient.id}
              type="button"
              onClick={() => handleSelectIngredient(ingredient)}
              className="w-full px-3 py-2 text-left hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-neutral-900">{ingredient.name}</div>
                  <div className="text-xs text-neutral-500 capitalize">
                    {ingredient.category} • {ingredient.calories} cal per 100{ingredient.base_unit}
                  </div>
                </div>
                <div className="text-xs text-neutral-400">
                  {ingredient.base_unit}
                </div>
              </div>
            </button>
          ))}

          {showCreateOption && (
            <div className="border-t border-neutral-200">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full px-3 py-2 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none transition-colors text-primary-600"
              >
                <div className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="font-medium">Create "{searchQuery}"</span>
                </div>
                <div className="text-xs text-primary-500 mt-1">
                  Add this ingredient to your database
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IngredientSearchSelect;