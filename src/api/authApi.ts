import apiClient from './apiClient';

export interface AuthStatus {
  mode: 'owner' | 'demo';
  login_locked_for: number;
}

export const authApi = {
  me: (): Promise<AuthStatus> => apiClient.get<AuthStatus>('/auth/me'),
  login: (pin: string): Promise<AuthStatus> => apiClient.post<AuthStatus>('/auth/login', { pin }),
  logout: (): Promise<AuthStatus> => apiClient.post<AuthStatus>('/auth/logout'),
};

export default authApi;
