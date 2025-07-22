import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChefHat, Wifi, WifiOff } from 'lucide-react';
import { useApiContext } from '../../context/ApiContext';

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000; // 1 second

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const location = useLocation();
  const { config } = useApiContext();
  
  const retryCount = useRef(0);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  const navigation = [
    { name: 'Recipes', href: '/recipes' },
    { name: 'Meal Plans', href: '/meal-plans' },
    { name: 'Shopping Lists', href: '/shopping-lists' },
    { name: 'Ingredients', href: '/ingredients' },
  ];
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  
  const testConnection = useCallback(async (isManual = false) => {
    if (isManual) {
      retryCount.current = 0;
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    }

    setConnectionStatus('checking');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      const response = await fetch(`${config.baseUrl}/ingredients/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setConnectionStatus('connected');
        retryCount.current = 0;
      } else {
        throw new Error('Server responded with an error');
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.warn('API connection test timed out.');
      }
      
      setConnectionStatus('disconnected');
      
      if (!isManual && retryCount.current < MAX_RETRIES) {
        const delay = INITIAL_DELAY * Math.pow(2, retryCount.current);
        console.log(`Connection failed. Retrying in ${delay / 1000}s...`);
        
        retryCount.current++;
        
        retryTimeout.current = setTimeout(() => {
          testConnection(false);
        }, delay);
      } else if (!isManual) {
        console.error(`Connection failed after ${MAX_RETRIES} retries. Giving up.`);
      }
    }
  }, [config.baseUrl, config.timeout]);
  
  useEffect(() => {
    testConnection(true); // Initial test on mount or config change

    return () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    };
  }, [testConnection]);
  
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-success-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-error-500" />;
      case 'checking':
        return <div className="h-4 w-4 border-2 border-warning-500 border-t-transparent rounded-full animate-spin" />;
    }
  };
  
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'checking':
        return 'Checking...';
    }
  };
  
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-success-600';
      case 'disconnected':
        return 'text-error-600';
      case 'checking':
        return 'text-warning-600';
    }
  };
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex h-14 sm:h-16 lg:h-18 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link to="/" className="flex items-center group">
                <ChefHat className="h-7 w-7 sm:h-8 sm:w-8 text-primary-600 group-hover:text-primary-700 transition-colors" />
                <span className="ml-2 text-lg sm:text-xl font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">
                  MealMaster
                </span>
              </Link>
            </div>
            
            <nav className="hidden lg:ml-8 xl:ml-12 lg:flex lg:space-x-6 xl:space-x-8" aria-label="Main navigation">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'border-primary-500 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
          
          <div className="hidden lg:ml-6 lg:flex lg:items-center">
            <button
              onClick={() => testConnection(true)}
              className="flex items-center text-xs xl:text-sm hover:bg-neutral-50 px-2 py-1 rounded transition-colors"
              title={`Click to test connection. Timeout: ${config.timeout}ms`}
            >
              <span className="mr-2 text-neutral-500 hidden xl:inline">API:</span>
              <span className={`flex items-center ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="ml-1 hidden xl:inline">{getStatusText()}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white">
          <div className="space-y-1 pt-2 pb-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700'
                }`}
                aria-current={isActive(item.href) ? 'page' : undefined}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="border-t border-neutral-200 pt-4 pb-3">
            <div className="flex items-center px-4">
              <button
                onClick={() => testConnection(true)}
                className="flex items-center text-sm hover:bg-neutral-50 px-2 py-1 rounded transition-colors"
                title={`Click to test connection. Timeout: ${config.timeout}ms`}
              >
                <span className="mr-2 text-neutral-500">API:</span>
                <span className={`flex items-center ${getStatusColor()}`}>
                  {getStatusIcon()}
                  <span className="ml-1">{getStatusText()}</span>
                </span>
              </button>
            </div>
            <div className="px-4 mt-2">
              <div className="text-xs text-neutral-500 break-all">
                {config.baseUrl} • {config.timeout}ms timeout
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
