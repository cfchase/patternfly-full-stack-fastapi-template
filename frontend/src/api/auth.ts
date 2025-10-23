/**
 * Authentication API endpoints.
 */
import apiClient from './client';

export interface LoginRequest {
  username: string; // OAuth2 uses 'username' field for email
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserPublic {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
}

/**
 * Login with email and password.
 * Returns access token on success.
 */
export const login = async (email: string, password: string): Promise<TokenResponse> => {
  // OAuth2 expects form data, not JSON
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await apiClient.post<TokenResponse>('/api/v1/login/access-token', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
};

/**
 * Test the current token and get user info.
 */
export const testToken = async (): Promise<UserPublic> => {
  const response = await apiClient.post<UserPublic>('/api/v1/login/test-token');
  return response.data;
};

/**
 * Register a new user account.
 */
export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export const register = async (data: RegisterRequest): Promise<UserPublic> => {
  const response = await apiClient.post<UserPublic>('/api/v1/users/signup', data);
  return response.data;
};
