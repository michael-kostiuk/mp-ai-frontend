export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

const apiConfig: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
};

export default apiConfig;