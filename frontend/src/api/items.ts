/**
 * Items API endpoints.
 */
import apiClient from './client';

export interface ItemPublic {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
}

export interface ItemsPublic {
  data: ItemPublic[];
  count: number;
}

export interface ItemCreate {
  title: string;
  description?: string;
}

export interface ItemUpdate {
  title?: string;
  description?: string;
}

/**
 * Get all items (filtered by ownership for normal users).
 */
export const getItems = async (skip: number = 0, limit: number = 100): Promise<ItemsPublic> => {
  const response = await apiClient.get<ItemsPublic>('/api/v1/items/', {
    params: { skip, limit },
  });
  return response.data;
};

/**
 * Get item by ID.
 */
export const getItemById = async (itemId: string): Promise<ItemPublic> => {
  const response = await apiClient.get<ItemPublic>(`/api/v1/items/${itemId}`);
  return response.data;
};

/**
 * Create a new item.
 */
export const createItem = async (data: ItemCreate): Promise<ItemPublic> => {
  const response = await apiClient.post<ItemPublic>('/api/v1/items/', data);
  return response.data;
};

/**
 * Update an item.
 */
export const updateItem = async (itemId: string, data: ItemUpdate): Promise<ItemPublic> => {
  const response = await apiClient.put<ItemPublic>(`/api/v1/items/${itemId}`, data);
  return response.data;
};

/**
 * Delete an item.
 */
export const deleteItem = async (itemId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/api/v1/items/${itemId}`);
  return response.data;
};
