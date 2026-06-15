import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, X } from 'lucide-react';
import { Ingredient } from '../../types';
import Input from '../ui/Input';
import useApi from '../../hooks/useApi';
import { getIngredients } from '../../api/ingredientApi';

interface IngredientSearchSelectProps {
  value: number;
  onChange: (ingredientId: number) => void;
  onCreateNew?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  initialDisplayName?: string;
}

const IngredientSearchSelect: React.FC<IngredientSearchSelectProps> = ({
  value,
  onChange,
  onCreateNew,
  placeholder,
  disabled = false,
  initialDisplayName = ''
}) => {
  const { t } = useTranslation();
  const actualPlaceholder = placeholder || t('ingredients.searchIngredients');
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasLoadedAllRef = useRef(false);
  const fallbackDisplayName = initialDisplayName || '';

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

  const { data: ingredients, loading, execute: searchIngredients } = useApi<Ingredient[]>(getIngredients);

  const setInputToFallbackDisplayName = useCallback((mode: 'force' | 'if-empty' = 'force') => {
    if (mode === 'force') {
      setInputValue(fallbackDisplayName);
      return;
    }
    if (fallbackDisplayName && !inputValue.trim()) {
      setInputValue(fallbackDisplayName);
    }
  }, [fallbackDisplayName, inputValue]);

  const loadAllIngredients = useCallback(async () => {
    if (hasLoadedAllRef.current) {
      return;
    }

    hasLoadedAllRef.current = true;
    try {
      await searchIngredients();
    } catch (error) {
      hasLoadedAllRef.current = false;
      console.error('Search error:', error);
    }
  }, [searchIngredients]);

  useEffect(() => {
    if (isOpen) {
      loadAllIngredients();
    }
  }, [isOpen, loadAllIngredients]);

  // Find and set selected ingredient when value changes (only if user is not actively typing)
  useEffect(() => {
    if (!isUserTyping && value && value !== selectedIngredient?.id) {
      // Check if we already have this ingredient in our current results
      const existingIngredient = ingredients?.find(ing => ing.id === value);
      if (existingIngredient) {
        setSelectedIngredient(existingIngredient);
        setInputValue(existingIngredient.name);
      } else if (value > 0) {
        setInputToFallbackDisplayName('if-empty');
        // Need to load all ingredients to find this specific one
        loadAllIngredients();
      }
    } else if (!isUserTyping && value === 0) {
      setSelectedIngredient(null);
      setInputToFallbackDisplayName('force');
    }
  }, [value, ingredients, isUserTyping, selectedIngredient?.id, loadAllIngredients, setInputToFallbackDisplayName]);

  // Handle input changes with debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsUserTyping(true); // Mark that user is actively typing

    if (!isOpen) {
      setIsOpen(true);
    }
    loadAllIngredients();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setIsUserTyping(true);
    // Only clear if there's a selected ingredient, otherwise keep the current input
    if (selectedIngredient) {
      setInputValue('');
    } else {
      setInputToFallbackDisplayName('if-empty');
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
          setInputToFallbackDisplayName('force');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedIngredient, setInputToFallbackDisplayName]);

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
    if (!isOpen) {
      setIsOpen(true);
    }
    loadAllIngredients();
    inputRef.current?.focus();
  };

  const normalizedQuery = inputValue.trim().toLowerCase();
  const filteredIngredients = (ingredients || []).filter((ingredient) => {
    if (!normalizedQuery) {
      return true;
    }
    return (
      ingredient.name.toLowerCase().includes(normalizedQuery) ||
      ingredient.category.toLowerCase().includes(normalizedQuery)
    );
  });
  const hasExactMatch = filteredIngredients.some(
    ing => ing.name.toLowerCase() === inputValue.toLowerCase()
  );
  const showCreateOption = inputValue.trim() && !hasExactMatch && onCreateNew;
  const showMinCharMessage = false; // Remove minimum character message since we search from 1 char
  const showNoResults = isOpen && !loading && !showMinCharMessage && inputValue.trim().length >= 1 && filteredIngredients.length === 0 && !showCreateOption;

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
          placeholder={actualPlaceholder}
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
        <div
          ref={dropdownRef}
          className={`absolute z-[100] w-full bg-white border border-neutral-200 rounded-md shadow-xl max-h-60 overflow-y-auto ${dropdownPosition === 'above'
            ? 'bottom-full mb-1'
            : 'top-full mt-1'
            }`}
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-neutral-500 text-center">
              {t('ingredients.searchingIngredients')}
            </div>
          )}

          {showNoResults && (
            <div className="px-3 py-2 text-sm text-neutral-500 text-center">
              {t('ingredients.noIngredientsFound')}
            </div>
          )}

          {!loading && !showMinCharMessage && (inputValue.trim().length >= 1 || inputValue.trim().length === 0) && filteredIngredients.map((ingredient) => (
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
                    {ingredient.category} • {t('ingredients.calPer100', { calories: ingredient.calories, unit: ingredient.base_unit })}
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
                  <span className="font-medium">{t('ingredients.createIngredient', { name: inputValue })}</span>
                </div>
                <div className="text-xs text-primary-500 mt-1">
                  {t('ingredients.addToDatabase')}
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
