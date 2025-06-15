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
  const [inputValue, setInputValue] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchQueryRef = useRef<string>('');

  const { data: ingredients, loading, execute: searchIngredients } = useApi<Ingredient[]>(getIngredients);

  // Find and set selected ingredient when value changes (only if user is not actively typing)
  useEffect(() => {
    if (!isUserTyping && value && value !== selectedIngredient?.id) {
      // Check if we already have this ingredient in our current results
      const existingIngredient = ingredients?.find(ing => ing.id === value);
      if (existingIngredient) {
        setSelectedIngredient(existingIngredient);
        setInputValue(existingIngredient.name);
      } else if (value > 0) {
        // Need to load all ingredients to find this specific one
        performSearch('', true);
      }
    } else if (!isUserTyping && value === 0) {
      setSelectedIngredient(null);
      setInputValue('');
    }
  }, [value, ingredients, isUserTyping]);

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
          // Load all ingredients (for finding pre-selected ingredient)
          await searchIngredients();
        } else if (query.trim().length >= 3) {
          // Search by name with minimum 3 characters
          await searchIngredients({ name: query.trim() });
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    if (loadAll) {
      // Execute immediately for loading all ingredients
      executeSearch();
    } else if (query.trim().length >= 3) {
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
    // Only clear if there's a selected ingredient, otherwise keep the current input
    if (selectedIngredient) {
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
        // Reset input to selected ingredient name or empty
        if (selectedIngredient) {
          setInputValue(selectedIngredient.name);
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
  }, [selectedIngredient]);

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setInputValue(ingredient.name);
    setIsUserTyping(false);
    onChange(ingredient.id);
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
    setSelectedIngredient(null);
    setInputValue('');
    setIsUserTyping(false);
    onChange(0);
    lastSearchQueryRef.current = '';
    inputRef.current?.focus();
  };

  const filteredIngredients = ingredients || [];
  const hasExactMatch = filteredIngredients.some(
    ing => ing.name.toLowerCase() === inputValue.toLowerCase()
  );
  const showCreateOption = inputValue.trim() && !hasExactMatch && onCreateNew;
  const showMinCharMessage = isOpen && inputValue.trim().length > 0 && inputValue.trim().length < 3;
  const showNoResults = isOpen && !loading && !showMinCharMessage && inputValue.trim().length >= 3 && filteredIngredients.length === 0 && !showCreateOption;

  return (
    <div ref={containerRef} className="relative">
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

          {showMinCharMessage && (
            <div className="px-3 py-2 text-sm text-neutral-400 text-center">
              Type at least 3 characters to search
            </div>
          )}

          {showNoResults && (
            <div className="px-3 py-2 text-sm text-neutral-500 text-center">
              No ingredients found
            </div>
          )}

          {!loading && !showMinCharMessage && (inputValue.trim().length >= 3 || inputValue.trim().length === 0) && filteredIngredients.map((ingredient) => (
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
                  <span className="font-medium">Create "{inputValue}"</span>
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