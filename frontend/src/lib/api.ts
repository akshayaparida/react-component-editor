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

  list: async (params: number | { limit?: number; search?: string } = 10) => {
    let limit = 10
    let search = ''
    if (typeof params === 'number') {
      limit = params
    } else if (typeof params === 'object') {
      limit = params.limit ?? 50
      search = params.search ?? ''
    }
    const qs = new URLSearchParams()
    qs.set('limit', String(limit))
    if (search) qs.set('search', search)
    const response = await api.get(`/visual-components?${qs.toString()}`)
    return response.data.data
  }
}
