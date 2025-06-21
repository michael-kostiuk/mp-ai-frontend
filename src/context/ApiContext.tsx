import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import apiConfig, { ApiConfig } from '../config/apiConfig';
import { getApiClient } from '../api/apiClient';

interface ApiContextType {
  config: ApiConfig;
  updateBaseUrl: (url: string) => void;
  updateTimeout: (timeout: number) => void;
  updateConfig: (config: ApiConfig) => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ApiConfig>(apiConfig);
  
  const updateBaseUrl = (url: string) => {
    const newConfig = { ...config, baseUrl: url };
    setConfig(newConfig);
    
    // Update the API client immediately
    const client = getApiClient();
    client.baseUrl = url;
    
    console.log('API Base URL updated to:', url);
  };
  
  const updateTimeout = (timeout: number) => {
    const newConfig = { ...config, timeout };
    setConfig(newConfig);
    
    // Update the API client immediately
    const client = getApiClient();
    client.timeout = timeout;
    
    console.log('API Timeout updated to:', timeout, 'ms');
  };
  
  const updateConfig = (newConfig: ApiConfig) => {
    setConfig(newConfig);
    
    // Update the API client immediately
    const client = getApiClient();
    client.updateConfig(newConfig.baseUrl, newConfig.timeout);
    
    console.log('API Configuration updated:', newConfig);
  };
  
  // Initialize API client with current config on mount
  useEffect(() => {
    const client = getApiClient();
    client.updateConfig(config.baseUrl, config.timeout);
  }, []);
  
  return (
    <ApiContext.Provider value={{ config, updateBaseUrl, updateTimeout, updateConfig }}>
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