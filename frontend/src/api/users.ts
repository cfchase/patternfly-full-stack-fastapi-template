/**
 * Users API endpoints.
 */
import apiClient from './client';
import { UserPublic } from './auth';

export interface UsersPublic {
  data: UserPublic[];
  count: number;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  is_superuser?: boolean;
}

export interface UpdatePassword {
  current_password: string;
  new_password: string;
}

/**
 * Get current user profile.
 */
export const getCurrentUser = async (): Promise<UserPublic> => {
  const response = await apiClient.get<UserPublic>('/api/v1/users/me');
  return response.data;
};

/**
 * Update current user profile.
 */
export const updateCurrentUser = async (data: UserUpdate): Promise<UserPublic> => {
  const response = await apiClient.patch<UserPublic>('/api/v1/users/me', data);
  return response.data;
};

/**
 * Update current user password.
 */
export const updatePassword = async (data: UpdatePassword): Promise<{ message: string }> => {
  const response = await apiClient.patch<{ message: string }>('/api/v1/users/me/password', data);
  return response.data;
};

/**
 * Delete current user account.
 */
export const deleteCurrentUser = async (): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>('/api/v1/users/me');
  return response.data;
};

/**
 * Get all users (admin only).
 */
export const getUsers = async (skip: number = 0, limit: number = 100): Promise<UsersPublic> => {
  const response = await apiClient.get<UsersPublic>('/api/v1/users/', {
    params: { skip, limit },
  });
  return response.data;
};

/**
 * Create a new user (admin only).
 */
export const createUser = async (data: UserCreate): Promise<UserPublic> => {
  const response = await apiClient.post<UserPublic>('/api/v1/users/', data);
  return response.data;
};

/**
 * Get user by ID (admin only).
 */
export const getUserById = async (userId: string): Promise<UserPublic> => {
  const response = await apiClient.get<UserPublic>(`/api/v1/users/${userId}`);
  return response.data;
};

/**
 * Update user by ID (admin only).
 */
export const updateUser = async (userId: string, data: Partial<UserCreate>): Promise<UserPublic> => {
  const response = await apiClient.patch<UserPublic>(`/api/v1/users/${userId}`, data);
  return response.data;
};

/**
 * Delete user by ID (admin only).
 */
export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/api/v1/users/${userId}`);
  return response.data;
};
