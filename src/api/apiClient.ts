import { ApiError } from '../types';
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

  async get<T>(endpoint: string, queryParams?: Record<string, any>): Promise<T> {
    const url = this.createUrl(endpoint);
    const queryString = queryParams ? new URLSearchParams(queryParams as any).toString() : '';
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    return this.handleResponse<T>(
      fetch(fullUrl, {
        method: 'GET',
        headers: this.getHeaders()
      })
    );
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = this.createUrl(endpoint);

    return this.handleResponse<T>(
      fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined
      })
    );
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
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
    const baseUrl = import.meta.env.VITE_API_URL || 'https://mealplanner-eu.onrender.com';
    const timeout = 60000; // 60s for uploads
    apiClient = new ApiClient(baseUrl, timeout);
  }
  return apiClient;
};

// Export the singleton instance
export default getApiClient();