export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

const FALLBACK_BASE_URL = 'http://localhost:8000';
const STORAGE_KEY = 'apiConfig';
const envBaseUrl = import.meta.env.VITE_API_URL?.trim();

type RuntimeConfig = { apiBaseUrl?: string } | undefined;
const getRuntimeBaseUrl = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const runtimeConfig = (window as { __MP_RUNTIME_CONFIG__?: RuntimeConfig }).__MP_RUNTIME_CONFIG__;
  const runtimeBaseUrl = runtimeConfig?.apiBaseUrl?.trim();

  return runtimeBaseUrl || undefined;
};

export const DEFAULT_TIMEOUT = 10000;

const readStoredApiConfig = (): Partial<ApiConfig> | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ApiConfig>;
    const baseUrl = typeof parsed.baseUrl === 'string' ? parsed.baseUrl : undefined;
    const timeout = typeof parsed.timeout === 'number' ? parsed.timeout : undefined;

    return { baseUrl, timeout };
  } catch {
    return null;
  }
};

export const persistApiConfig = (config: ApiConfig): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const getDefaultBaseUrl = (): string => {
  return getRuntimeBaseUrl() || envBaseUrl || FALLBACK_BASE_URL;
};

export const resolveApiConfig = (): ApiConfig => {
  const storedConfig = readStoredApiConfig();
  const runtimeBaseUrl = getRuntimeBaseUrl();
  const preferredBaseUrl = runtimeBaseUrl || envBaseUrl;

  const baseUrl = preferredBaseUrl || storedConfig?.baseUrl || FALLBACK_BASE_URL;
  const timeout = storedConfig?.timeout ?? DEFAULT_TIMEOUT;

  // Keep storage aligned with runtime/env so stale values never shadow production config.
  if (preferredBaseUrl && typeof window !== 'undefined' && storedConfig?.baseUrl !== preferredBaseUrl) {
    persistApiConfig({ baseUrl, timeout });
  }

  return { baseUrl, timeout };
};

const apiConfig: ApiConfig = resolveApiConfig();

export default apiConfig;
