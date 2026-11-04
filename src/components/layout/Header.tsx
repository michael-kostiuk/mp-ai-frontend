import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, WifiOff, Home, BookOpen, CalendarDays, ShoppingCart, Carrot } from 'lucide-react';
import { useApiContext } from '../../context/ApiContext';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import BrandMark from '../ui/BrandMark';
import LoginModal from '../auth/LoginModal';
import { useAuth } from '../../context/AuthContext';

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000; // 1 second

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { config } = useApiContext();
  const { mode, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const loginTriggerRef = useRef<HTMLElement | null>(null);

  const closeLogin = () => {
    setIsLoginOpen(false);
    // Wait for the modal to unmount so its input does not keep focus.
    requestAnimationFrame(() => loginTriggerRef.current?.focus());
  };
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const location = useLocation();
  const navigate = useNavigate();
  // Inner pages (one recipe, plan, list or ingredient) get a back arrow in the phone header,
  // like other apps; it returns where the user came from, or to the section's list
  const parentPath = location.pathname.match(/^\/(recipes|meal-plans|shopping-lists|ingredients)\/[^/]+/)?.[1];
  const goBack = () => {
    if ((window.history.state?.idx ?? 0) > 0) return navigate(-1);
    // Opened straight from a link: a recipe seen from a plan or list goes back there
    const params = new URLSearchParams(location.search);
    const fromPlan = params.get('fromMealPlan');
    const fromList = params.get('fromShoppingList');
    navigate(fromPlan ? `/meal-plans/${fromPlan}` : fromList ? `/shopping-lists/${fromList}` : `/${parentPath}`);
  };
  const baseUrl = config.baseUrl;
  const timeout = config.timeout;
  
  const retryCount = useRef(0);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  const navigation = [
    { name: t('nav.recipes'), short: t('nav.short.recipes'), href: '/recipes', icon: BookOpen },
    { name: t('nav.mealPlans'), short: t('nav.short.mealPlans'), href: '/meal-plans', icon: CalendarDays },
    { name: t('nav.shoppingLists'), short: t('nav.short.shoppingLists'), href: '/shopping-lists', icon: ShoppingCart },
    { name: t('nav.ingredients'), short: t('nav.short.ingredients'), href: '/ingredients', icon: Carrot },
  ];
  // Phones get a tab bar at the bottom: today first, then the sections in the order they are used
  const tabs = [
    { name: t('nav.short.today'), href: '/', icon: Home },
    navigation[1],
    navigation[2],
    navigation[0],
    navigation[3],
  ].map((tab) => ({ name: 'short' in tab ? tab.short : tab.name, href: tab.href, icon: tab.icon }));

  const isActive = (path: string) => {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  };
  
  const testConnection = useCallback(async (isManual = false) => {
    if (isManual) {
      retryCount.current = 0;
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    }

    // Automatic retries keep the offline banner up instead of flickering it
    if (isManual) setConnectionStatus('checking');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${baseUrl}/ingredients/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
        credentials: 'include',
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

        
        retryCount.current++;
        
        retryTimeout.current = setTimeout(() => {
          testConnection(false);
        }, delay);
      } else if (!isManual) {

      }
    }
  }, [baseUrl, timeout]);
  
  useEffect(() => {
    testConnection(true); // Initial test on mount or config change

    return () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    };
  }, [testConnection]);
  
  const authButton = (className: string) => {
    // Reserve the button's space while the session loads so the header doesn't jump
    if (mode === 'loading') {
      return <span className={`${className} invisible`} aria-hidden="true">{t('auth.login')}</span>;
    }
    const isOwner = mode === 'owner';
    return (
      <button
        type="button"
        className={className}
        onClick={(e) => {
          loginTriggerRef.current = e.currentTarget;
          if (isOwner) void logout();
          else setIsLoginOpen(true);
        }}
      >
        {isOwner ? t('auth.logout') : t('auth.login')}
      </button>
    );
  };

  return (
    <header className="bg-neutral-50 border-b border-neutral-200 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex h-14 sm:h-16 lg:h-18 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              {parentPath && (
                <button
                  type="button"
                  onClick={goBack}
                  className="lg:hidden -ml-2 mr-1 inline-flex items-center justify-center rounded-full p-2 text-neutral-700 hover:bg-neutral-100"
                  aria-label={t('common.back')}
                >
                  <ArrowLeft className="h-6 w-6" aria-hidden="true" />
                </button>
              )}
              <Link to="/" className="flex items-center group">
                <BrandMark className="h-6 w-6 sm:h-7 sm:w-7 text-neutral-900" />
                <span className="ml-2 text-lg sm:text-xl font-bold tracking-[-0.03em] text-neutral-900">
                  {t('header.appName')}
                </span>
              </Link>
              {mode === 'demo' && (
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                  {t('auth.demo')}
                </span>
              )}
            </div>
            
            <nav className="hidden lg:ml-8 xl:ml-12 lg:flex lg:space-x-6 xl:space-x-8" aria-label="Main navigation">
              {navigation.map((item) => (
                <Link
                  key={item.href}
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
          
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            {authButton('text-sm text-neutral-500 hover:text-neutral-700 px-2 py-1 rounded transition-colors')}
          </div>
          
          <div className="hidden lg:ml-6 lg:flex lg:items-center gap-2">
            <LanguageSwitcher />
            {authButton('text-sm text-neutral-500 hover:text-neutral-700 px-2 py-1 rounded transition-colors')}
          </div>
        </div>
      </div>
      
      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
        aria-label={t('header.mobileNavigation')}
      >
        <ul className="grid grid-cols-5">
          {tabs.map(({ name, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  to={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                    active ? 'text-primary-700' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${active ? 'stroke-[2.25]' : ''}`} aria-hidden="true" />
                  <span className="max-w-full truncate px-0.5">{name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {connectionStatus === 'disconnected' && (
        <div className="border-t border-error-200 bg-error-50" role="status">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-2 flex items-center justify-between gap-3 text-sm text-error-700">
            <span className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('header.offline')}
            </span>
            <button
              type="button"
              onClick={() => testConnection(true)}
              className="shrink-0 font-medium underline hover:text-error-800"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        </div>
      )}
      <LoginModal isOpen={isLoginOpen} onClose={closeLogin} />
    </header>
  );
};

export default Header;
