import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple API client without authentication
// Visual components are public and don't require auth

// Visual Components API (no auth required)
export const visualComponentsApi = {
  create: async (data: { name?: string; jsxCode: string; description?: string }) => {
    const response = await api.post('/visual-components', data)
    return response.data.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/visual-components/${id}`)
    return response.data.data
  },

  update: async (id: string, data: { name?: string; jsxCode?: string; description?: string }) => {
    const response = await api.put(`/visual-components/${id}`, data)
    return response.data.data
  },

  list: async (limit = 10) => {
    const response = await api.get(`/visual-components?limit=${limit}`)
    return response.data.data
  }
}
