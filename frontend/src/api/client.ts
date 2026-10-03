// Zabezpieczenie przed błędem TS: Property 'env' does not exist on type 'ImportMeta'
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export interface HealthResponse {
  status: string;
}

export interface BackendAttraction {
  id: number;
  osm_type: string;
  osm_id: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  category: string;
  monument_type: string;
  monument_subtype?: string;
  wheelchair?: string;
  wheelchair_description?: string;
  toilets_wheelchair?: string;
  address?: string;
  website?: string;
  opening_hours?: string;
  wikipedia?: string;
  image?: string;
}

export interface AttractionName {
  name: string;
  category: string;
  monument_type?: string;
  category_display?: string;
}

export const api = {
  // Sprawdzenie stanu backendu
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) {
      throw new Error(`Health check failed: ${res.statusText}`);
    }
    return res.json();
  },

  // Pobranie losowych atrakcji (np. do propozycji na start)
  async getRandomAttractions(limit = 20): Promise<BackendAttraction[]> {
    const res = await fetch(`${API_BASE_URL}/api/attractions/random?limit=${limit}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch attractions: ${res.statusText}`);
    }
    return res.json();
  },

  // Pobranie spisu wszystkich nazw z bazy
  async getAttractionNames(): Promise<AttractionName[]> {
    const res = await fetch(`${API_BASE_URL}/api/attractions/names`);
    if (!res.ok) {
      throw new Error(`Failed to fetch attraction names: ${res.statusText}`);
    }
    return res.json();
  },
};