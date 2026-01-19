export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

const apiConfig: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://mealplanner-eu.onrender.com',
  timeout: 10000,
};

export default apiConfig;