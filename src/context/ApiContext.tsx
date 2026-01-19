import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ApiConfig } from '../config/apiConfig';
import { getApiClient } from '../api/apiClient';

// Function to get config from localStorage
const getConfigFromStorage = (): ApiConfig => {
  const storedConfig = localStorage.getItem('apiConfig');
  if (storedConfig) {
    return JSON.parse(storedConfig);
  }
  // Default config if nothing is in storage
  return {
    baseUrl: import.meta.env.VITE_API_URL || 'https://mealplanner-eu.onrender.com',
    timeout: 10000,
  };
};

// Function to set config in localStorage
const setConfigInStorage = (config: ApiConfig) => {
  localStorage.setItem('apiConfig', JSON.stringify(config));
};

interface ApiContextType {
  config: ApiConfig;
  updateConfig: (config: ApiConfig) => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ApiConfig>(getConfigFromStorage);

  const updateConfig = (newConfig: ApiConfig) => {
    setConfig(newConfig);
    setConfigInStorage(newConfig);

    // Update the API client immediately
    const client = getApiClient();
    client.updateConfig(newConfig.baseUrl, newConfig.timeout);

    console.log('API Configuration updated:', newConfig);
  };

  // Initialize API client with current config on mount
  useEffect(() => {
    const client = getApiClient();
    client.updateConfig(config.baseUrl, config.timeout);
  }, [config]);

  return (
    <ApiContext.Provider value={{ config, updateConfig }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApiContext = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApiContext must be used within an ApiProvider');
  }
  return context;
};
