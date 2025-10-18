import axios from 'axios';

export interface Item {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
}

export interface ItemCreate {
  title: string;
  description?: string;
}

export interface ItemUpdate {
  title?: string;
  description?: string;
}

export interface ItemsResponse {
  data: Item[];
  count: number;
}

const API_BASE = '/api/v1/items';

export const itemService = {
  async getItems(): Promise<ItemsResponse> {
    const response = await axios.get<ItemsResponse>(API_BASE);
    return response.data;
  },

  async getItem(id: string): Promise<Item> {
    const response = await axios.get<Item>(`${API_BASE}/${id}`);
    return response.data;
  },

  async createItem(item: ItemCreate): Promise<Item> {
    const response = await axios.post<Item>(API_BASE, item);
    return response.data;
  },

  async updateItem(id: string, item: ItemUpdate): Promise<Item> {
    const response = await axios.put<Item>(`${API_BASE}/${id}`, item);
    return response.data;
  },

  async deleteItem(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/${id}`);
  },
};
