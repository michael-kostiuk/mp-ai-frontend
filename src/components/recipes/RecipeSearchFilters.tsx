import React, { useState, useRef, useEffect } from 'react';
import { Search, Sliders } from 'lucide-react';
import { RecipeFilterParams } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

interface RecipeSearchFiltersProps {
  onFilterChange: (filters: RecipeFilterParams) => void;
}

const RecipeSearchFilters: React.FC<RecipeSearchFiltersProps> = ({
  onFilterChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [maxPrepTime, setMaxPrepTime] = useState<number | undefined>(undefined);
  const [minCalories, setMinCalories] = useState<number | undefined>(undefined);
  const [maxCalories, setMaxCalories] = useState<number | undefined>(undefined);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'snack', label: 'Snack' },
  ];

  const dietaryTagOptions = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten-free', label: 'Gluten Free' },
    { value: 'dairy-free', label: 'Dairy Free' },
    { value: 'keto', label: 'Keto' },
    { value: 'low-carb', label: 'Low Carb' },
    { value: 'high-protein', label: 'High Protein' },
  ];

  // Debounced search function
  const debouncedSearch = (query: string) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      if (query.trim().length >= 3 || query.trim().length === 0) {
        handleSearch(query);
      }
    }, 300); // 300ms delay
  };

  // Auto-search when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = (query?: string) => {
    const searchTerm = query !== undefined ? query : searchQuery;

    // For search, we'd use the search endpoint instead of filters
    if (searchTerm.trim().length >= 3) {
      // This would typically use a different API endpoint for search
      console.log('Searching for:', searchTerm);
      onFilterChange({
        name: searchTerm.trim(),
        category: category || undefined,
        dietary_tags: dietaryTags.length > 0 ? dietaryTags : undefined,
        max_prep_time: maxPrepTime,
        min_calories: minCalories,
        max_calories: maxCalories,
      });
    } else if (searchTerm.trim().length === 0) {
      // Apply filters without search term
      onFilterChange({
        category: category || undefined,
        dietary_tags: dietaryTags.length > 0 ? dietaryTags : undefined,
        max_prep_time: maxPrepTime,
        min_calories: minCalories,
        max_calories: maxCalories,
      });
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setCategory(undefined);
    setDietaryTags([]);
    setMaxPrepTime(undefined);
    setMinCalories(undefined);
    setMaxCalories(undefined);

    onFilterChange({});
  };

  const toggleDietaryTag = (tag: string) => {
    setDietaryTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const showMinCharMessage = searchQuery.trim().length > 0 && searchQuery.trim().length < 3;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 transition-all">
      <div className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                leftIcon={<Search className="h-5 w-5" />}
                fullWidth
              />
              {showMinCharMessage && (
                <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-white border border-neutral-200 rounded-md shadow-sm text-sm text-neutral-400 z-10">
                  Type at least 3 characters to search
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={() => handleSearch()}
            className="flex-shrink-0"
            disabled={searchQuery.trim().length > 0 && searchQuery.trim().length < 3}
          >
            Search
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
          >
            <Sliders className="h-5 w-5 mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 animate-slideIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Category"
              options={categoryOptions}
              value={category || ''}
              onChange={setCategory}
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Max Prep Time (minutes)
              </label>
              <Input
                type="number"
                value={maxPrepTime?.toString() || ''}
                onChange={(e) => setMaxPrepTime(e.target.value ? Number(e.target.value) : undefined)}
                fullWidth
                min={5}
                step={5}
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Calories
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minCalories?.toString() || ''}
                  onChange={(e) => setMinCalories(e.target.value ? Number(e.target.value) : undefined)}
                  fullWidth
                  min={0}
                  step={50}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxCalories?.toString() || ''}
                  onChange={(e) => setMaxCalories(e.target.value ? Number(e.target.value) : undefined)}
                  fullWidth
                  min={0}
                  step={50}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {dietaryTagOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleDietaryTag(option.value)}
                  className={`
                    inline-flex items-center rounded-full px-3 py-1 text-sm font-medium 
                    ${dietaryTags.includes(option.value)
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }
                    transition-colors
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              type="button"
              onClick={() => handleSearch()}
              disabled={searchQuery.trim().length > 0 && searchQuery.trim().length < 3}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeSearchFilters;