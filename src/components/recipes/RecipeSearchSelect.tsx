import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Recipe } from '../../types';
import Input from '../ui/Input';
import useApi from '../../hooks/useApi';
import { getRecipes } from '../../api/recipeApi';

interface RecipeSearchSelectProps {
  value: number;
  onChange: (recipeId: number) => void;
  onCreateNew?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  initialDisplayName?: string; // Add this prop to show existing recipe name
}

const RecipeSearchSelect: React.FC<RecipeSearchSelectProps> = ({
  value,
  onChange,
  onCreateNew,
  placeholder = "Search recipes...",
  disabled = false,
  initialDisplayName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchQueryRef = useRef<string>('');

  const { data: recipes, loading, execute: searchRecipes } = useApi<Recipe[]>(getRecipes);

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 240; // max-h-60 = 15rem = 240px
      const spaceBelow = window.innerHeight - containerRect.bottom;
      const spaceAbove = containerRect.top;

      // If there's not enough space below but enough above, position above
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('above');
      } else {
        setDropdownPosition('below');
      }
    }
  }, [isOpen]);

  // Initialize with existing recipe name if provided
  useEffect(() => {
    if (initialDisplayName && value > 0 && !selectedRecipe) {
      // Create a minimal recipe object for display purposes
      const displayRecipe: Recipe = {
        id: value,
        name: initialDisplayName,
        // Add other required fields with default values
        servings: 1,
        prep_time: 0,
        cook_time: 0,
        instructions: '',
        category: '',
        dietary_tags: [],
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        breakfast_weight: 0,
        lunch_weight: 0,
        dinner_weight: 0,
        created_at: '',
        ingredients: []
      };
      setSelectedRecipe(displayRecipe);
      setInputValue(initialDisplayName);
    }
  }, [initialDisplayName, value, selectedRecipe]);

  // Find and set selected recipe when value changes (only if user is not actively typing)
  useEffect(() => {
    if (!isUserTyping && value && value !== selectedRecipe?.id) {
      // Check if we already have this recipe in our current results
      const existingRecipe = recipes?.find(rec => rec.id === value);
      if (existingRecipe) {
        setSelectedRecipe(existingRecipe);
        setInputValue(existingRecipe.name);
      } else if (value > 0 && !initialDisplayName) {
        // Only load all recipes if we don't have an initial display name
        performSearch('', true);
      }
    } else if (!isUserTyping && value === 0) {
      setSelectedRecipe(null);
      setInputValue('');
    }
  }, [value, recipes, isUserTyping, initialDisplayName]);

  // Debounced search function
  const performSearch = async (query: string, loadAll = false) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const executeSearch = async () => {
      try {
        // Avoid duplicate requests
        const searchKey = loadAll ? '__ALL__' : query.trim();
        if (lastSearchQueryRef.current === searchKey) {
          return;
        }
        lastSearchQueryRef.current = searchKey;

        if (loadAll) {
          // Load all recipes (for finding pre-selected recipe)
          await searchRecipes();
        } else if (query.trim().length >= 1) {
          // Search by name with minimum 1 character
          await searchRecipes({ name: query.trim() });
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    if (loadAll) {
      // Execute immediately for loading all recipes
      executeSearch();
    } else if (query.trim().length >= 1) {
      // Set timeout for user search
      debounceTimeoutRef.current = setTimeout(executeSearch, 300);
    }
  };

  // Handle input changes with debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsUserTyping(true); // Mark that user is actively typing

    if (!isOpen) {
      setIsOpen(true);
    }

    // Search based on user input
    performSearch(newValue);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setIsUserTyping(true);
    // Only clear if there's a selected recipe, otherwise keep the current input
    if (selectedRecipe) {
      setInputValue('');
      // Reset last search to allow fresh search
      lastSearchQueryRef.current = '';
    }
  };

  const handleInputBlur = () => {
    // Small delay to allow for click events on dropdown items
    setTimeout(() => {
      setIsUserTyping(false);
    }, 150);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsUserTyping(false);
        // Reset input to selected recipe name or empty
        if (selectedRecipe) {
          setInputValue(selectedRecipe.name);
        } else {
          setInputValue('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [selectedRecipe]);

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setInputValue(recipe.name);
    setIsUserTyping(false);
    onChange(recipe.id);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    if (onCreateNew && inputValue.trim()) {
      onCreateNew(inputValue.trim());
      setIsOpen(false);
      setIsUserTyping(false);
    }
  };

  const handleClear = () => {
    setSelectedRecipe(null);
    setInputValue('');
    setIsUserTyping(false);
    onChange(0);
    lastSearchQueryRef.current = '';
    inputRef.current?.focus();
  };

  const filteredRecipes = recipes || [];
  const hasExactMatch = filteredRecipes.some(
    rec => rec.name.toLowerCase() === inputValue.toLowerCase()
  );
  const showCreateOption = inputValue.trim() && !hasExactMatch && onCreateNew;
  const showMinCharMessage = false; // Remove minimum character message since we search from 1 char
  const showNoResults = isOpen && !loading && !showMinCharMessage && inputValue.trim().length >= 1 && filteredRecipes.length === 0 && !showCreateOption;

  return (
    <div ref={containerRef} className={`relative ${isOpen ? 'z-[1000]' : 'z-50'}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
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
        <div
          ref={dropdownRef}
          className={`absolute z-[100] w-full bg-white border border-neutral-200 rounded-md shadow-xl max-h-60 overflow-y-auto ${dropdownPosition === 'above'
            ? 'bottom-full mb-1'
            : 'top-full mt-1'
            }`}
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-neutral-500 text-center">
              Searching recipes...
            </div>
          )}

          {showNoResults && (
            <div className="px-3 py-2 text-sm text-neutral-500 text-center">
              No recipes found
            </div>
          )}

          {!loading && !showMinCharMessage && (inputValue.trim().length >= 1 || inputValue.trim().length === 0) && filteredRecipes.map((recipe) => (
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
                  <span className="font-medium">Create "{inputValue}"</span>
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
