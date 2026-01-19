import { checkResponse, formatApiError } from '../utils/apiUtils';

class ApiClient {
  private _baseUrl: string;
  private _timeout: number;

  constructor(baseUrl: string, timeout: number) {
    this._baseUrl = baseUrl;
    this._timeout = timeout;
  }

  // Getters and setters for dynamic configuration
  get baseUrl(): string {
    return this._baseUrl;
  }

  set baseUrl(url: string) {
    this._baseUrl = url;
  }

  get timeout(): number {
    return this._timeout;
  }

  set timeout(ms: number) {
    this._timeout = ms;
  }

  // Update both baseUrl and timeout
  updateConfig(baseUrl: string, timeout: number): void {
    this._baseUrl = baseUrl;
    this._timeout = timeout;
  }

  private createUrl(endpoint: string): string {
    return `${this._baseUrl}${endpoint}`;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private buildQueryString(queryParams: Record<string, string | number | boolean | Array<string | number | boolean>>): string {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    });
    return params.toString();
  }

  private async timeoutPromise<T>(ms: number, promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
      )
    ]);
  }

  private async handleResponse<T>(promise: Promise<Response>): Promise<T> {
    try {
      // Use current timeout value for each request
      const timeoutPromise = this.timeoutPromise(this._timeout, promise);
      const response = await timeoutPromise;
      const data = await checkResponse(response);
      return data as T;
    } catch (error) {
      throw formatApiError(error);
    }
  }

  async get<T>(endpoint: string, queryParams?: Record<string, string | number | boolean | Array<string | number | boolean>>): Promise<T> {
    const url = this.createUrl(endpoint);
    const queryString = queryParams ? this.buildQueryString(queryParams) : '';
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    return this.handleResponse<T>(
      fetch(fullUrl, {
        method: 'GET',
        headers: this.getHeaders()
      })
    );
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = this.createUrl(endpoint);

    return this.handleResponse<T>(
      fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined
      })
    );
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const url = this.createUrl(endpoint);

    return this.handleResponse<T>(
      fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      })
    );
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = this.createUrl(endpoint);

    return this.handleResponse<T>(
      fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      })
    );
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const url = this.createUrl(endpoint);
    const formData = new FormData();
    formData.append('file', file);

    return this.handleResponse<T>(
      fetch(url, {
        method: 'POST',
        body: formData
      })
    );
  }
}

// Create and export a singleton instance
let apiClient: ApiClient | null = null;

export const getApiClient = (): ApiClient => {
  if (!apiClient) {
    let baseUrl = import.meta.env.VITE_API_URL || 'https://mealplanner-eu.onrender.com';
    let timeout = 60000; // 60s for uploads

    // Check localStorage for override - vital for E2E testing
    try {
      const storedConfig = localStorage.getItem('apiConfig');
      console.log('API_CLIENT_FACTORY: storedConfig from localStorage:', storedConfig);
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        if (config.baseUrl) {
          console.log('API_CLIENT_FACTORY: Overriding baseUrl with:', config.baseUrl);
          baseUrl = config.baseUrl;
        }
        if (config.timeout) timeout = config.timeout;
      } else {
        console.log('API_CLIENT_FACTORY: No storedConfig found.');
      }
    } catch (e) {
      console.warn('API_CLIENT_FACTORY: Failed to load apiConfig from localStorage', e);
    }

    console.log(`API_CLIENT_FACTORY: Final baseUrl: ${baseUrl}`);
    apiClient = new ApiClient(baseUrl, timeout);
  }
  return apiClient;
};

// Export the singleton instance
export default getApiClient();
