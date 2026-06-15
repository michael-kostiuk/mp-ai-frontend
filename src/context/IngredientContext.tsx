import React, { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Ingredient } from '../types';
import useApi from '../hooks/useApi';
import { getIngredients } from '../api/ingredientApi';

interface IngredientContextType {
  ingredients: Ingredient[];
  loading: boolean;
  error: Error | null;
  fetchIngredients: () => void;
}

const IngredientContext = createContext<IngredientContextType | undefined>(undefined);

export const IngredientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: ingredients, loading, error, execute } = useApi<Ingredient[]>(getIngredients);

  const fetchIngredients = useCallback(() => {
    execute();
  }, [execute]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  return (
    <IngredientContext.Provider value={{ ingredients: ingredients || [], loading, error, fetchIngredients }}>
      {children}
    </IngredientContext.Provider>
  );
};

export const useIngredientContext = (): IngredientContextType => {
  const context = useContext(IngredientContext);
  if (context === undefined) {
    throw new Error('useIngredientContext must be used within an IngredientProvider');
  }
  return context;
};
