const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface HealthResponse {
  status: string;
  database: string;
  service: string;
}

export interface Item {
  id: number;
  title: string;
  description?: string;
  category?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface ItemCreateInput {
  title: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) {
      throw new Error(`Health check failed: ${res.statusText}`);
    }
    return res.json();
  },

  async getItems(): Promise<Item[]> {
    const res = await fetch(`${API_BASE_URL}/api/items/`);
    if (!res.ok) {
      throw new Error(`Failed to fetch items: ${res.statusText}`);
    }
    return res.json();
  },

  async createItem(item: ItemCreateInput): Promise<Item> {
    const res = await fetch(`${API_BASE_URL}/api/items/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      throw new Error(`Failed to create item: ${res.statusText}`);
    }
    return res.json();
  },

  async deleteItem(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/items/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete item: ${res.statusText}`);
    }
  },
};
