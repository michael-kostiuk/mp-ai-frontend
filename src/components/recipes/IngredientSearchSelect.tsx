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
  const [displayValue, setDisplayValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { data: ingredients, loading, execute: searchIngredients } = useApi<Ingredient[]>(getIngredients);

  // Find and set selected ingredient when value changes
  useEffect(() => {
    if (value && value !== selectedIngredient?.id) {
      // Only search if we don't already have the ingredient in our current results
      const existingIngredient = ingredients?.find(ing => ing.id === value);
      if (existingIngredient) {
        setSelectedIngredient(existingIngredient);
        setDisplayValue(existingIngredient.name);
      } else if (value > 0) {
        // Need to fetch this specific ingredient
        performSearch('', value);
      }
    } else if (value === 0) {
      setSelectedIngredient(null);
      setDisplayValue('');
    }
  }, [value, ingredients]);

  // Debounced search with cancellation
  const performSearch = (query: string, specificId?: number) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const executeSearch = async () => {
      try {
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        
        if (specificId) {
          // Search for specific ingredient by ID (when component mounts with pre-selected value)
          await searchIngredients({ id: specificId });
        } else if (query.trim().length >= 3) {
          // Search by name
          await searchIngredients({ name: query.trim() });
        }
      } catch (error) {
        // Ignore aborted requests
        if (error.name !== 'AbortError') {
          console.error('Search error:', error);
        }
      }
    };

    if (specificId || query.trim().length >= 3) {
      // Set timeout for search (except for specific ID lookups)
      if (specificId) {
        executeSearch();
      } else {
        debounceTimeoutRef.current = setTimeout(executeSearch, 300);
      }
    }
  };

  // Handle search query changes
  useEffect(() => {
    if (isOpen && searchQuery !== displayValue) {
      performSearch(searchQuery);
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset display to selected ingredient name or empty
        if (selectedIngredient) {
          setDisplayValue(selectedIngredient.name);
          setSearchQuery(selectedIngredient.name);
        } else {
          setDisplayValue('');
          setSearchQuery('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedIngredient]);

  const handleInputFocus = () => {
    setIsOpen(true);
    // Clear the input for fresh search
    setSearchQuery('');
    setDisplayValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setDisplayValue(newValue);
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setDisplayValue(ingredient.name);
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
    setDisplayValue('');
    setSearchQuery('');
    onChange(0);
    inputRef.current?.focus();
  };

  const filteredIngredients = ingredients || [];
  const hasExactMatch = filteredIngredients.some(
    ing => ing.name.toLowerCase() === searchQuery.toLowerCase()
  );
  const showCreateOption = searchQuery.trim() && !hasExactMatch && onCreateNew;
  const showMinCharMessage = isOpen && searchQuery.trim().length > 0 && searchQuery.trim().length < 3;
  const showNoResults = isOpen && !loading && !showMinCharMessage && searchQuery.trim().length >= 3 && filteredIngredients.length === 0 && !showCreateOption;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={displayValue}
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

          {!loading && !showMinCharMessage && searchQuery.trim().length >= 3 && filteredIngredients.map((ingredient) => (
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