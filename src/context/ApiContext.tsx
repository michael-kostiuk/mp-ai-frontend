import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ApiConfig, persistApiConfig, resolveApiConfig } from '../config/apiConfig';
import { getApiClient } from '../api/apiClient';

interface ApiContextType {
  config: ApiConfig;
  updateConfig: (config: ApiConfig) => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ApiConfig>(resolveApiConfig);

  const updateConfig = (newConfig: ApiConfig) => {
    setConfig(newConfig);
    persistApiConfig(newConfig);

    // Update the API client immediately
    const client = getApiClient();
    client.updateConfig(newConfig.baseUrl, newConfig.timeout);
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
