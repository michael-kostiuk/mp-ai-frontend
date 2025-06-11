import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Recipe } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import useApi from '../../hooks/useApi';
import { getRecipes } from '../../api/recipeApi';

interface RecipeSearchSelectProps {
  value: number;
  onChange: (recipeId: number) => void;
  onCreateNew?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const RecipeSearchSelect: React.FC<RecipeSearchSelectProps> = ({
  value,
  onChange,
  onCreateNew,
  placeholder = "Search recipes...",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: recipes, loading, execute: searchRecipes } = useApi<Recipe[]>(getRecipes);

  // Search recipes when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchRecipes({ name: searchQuery.trim() });
    } else if (isOpen) {
      searchRecipes();
    }
  }, [searchQuery, isOpen, searchRecipes]);

  // Find selected recipe when value changes
  useEffect(() => {
    if (value && recipes) {
      const recipe = recipes.find(rec => rec.id === value);
      setSelectedRecipe(recipe || null);
      if (recipe) {
        setSearchQuery(recipe.name);
      }
    } else {
      setSelectedRecipe(null);
      if (!isOpen) {
        setSearchQuery('');
      }
    }
  }, [value, recipes, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search query to selected recipe name if closed without selection
        if (selectedRecipe) {
          setSearchQuery(selectedRecipe.name);
        } else {
          setSearchQuery('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedRecipe]);

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setSearchQuery(recipe.name);
    onChange(recipe.id);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    if (onCreateNew && searchQuery.trim()) {
      onCreateNew(searchQuery.trim());
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedRecipe(null);
    setSearchQuery('');
    onChange(0);
    inputRef.current?.focus();
  };

  const filteredRecipes = recipes || [];
  const hasExactMatch = filteredRecipes.some(
    rec => rec.name.toLowerCase() === searchQuery.toLowerCase()
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
            selectedRecipe ? (
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
              Searching recipes...
            </div>
          )}

          {!loading && filteredRecipes.length === 0 && !showCreateOption && (
            <div className="px-3 py-2 text-sm text-neutral-500 text-center">
              No recipes found
            </div>
          )}

          {!loading && filteredRecipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => handleSelectRecipe(recipe)}
              className="w-full px-3 py-2 text-left hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-neutral-900">{recipe.name}</div>
                  <div className="text-xs text-neutral-500 capitalize">
                    {recipe.category} • {recipe.calories} cal • {recipe.servings} servings
                  </div>
                </div>
                <div className="text-xs text-neutral-400">
                  {recipe.prep_time + recipe.cook_time}m
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
                  Add this recipe to your database
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipeSearchSelect;