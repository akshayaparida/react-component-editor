import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// Token manager with localStorage persistence
const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export const tokenManager = {
  getToken(): string | null {
    try { return localStorage.getItem(ACCESS_KEY) } catch { return null }
  },
  setToken(token: string) {
    try { localStorage.setItem(ACCESS_KEY, token) } catch {}
  },
  getRefreshToken(): string | null {
    try { return localStorage.getItem(REFRESH_KEY) } catch { return null }
  },
  setRefreshToken(token: string) {
    try { localStorage.setItem(REFRESH_KEY, token) } catch {}
  },
  clearTokens() {
    try {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
    } catch {}
  }
}

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization from tokenManager for every request
api.interceptors.request.use((config) => {
  const token = tokenManager.getToken()
  if (token) {
    config.headers = config.headers || {}
    ;(config.headers as any)['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Auth API
export const authApi = {
  async getProfile() {
    const res = await api.get('/auth/me')
    return res.data.data
  },
  async login(credentials: { email: string; password: string }) {
    const res = await api.post('/auth/login', credentials)
    return res.data.data
  },
  async register(data: { email: string; username: string; password: string; name?: string; turnstileToken?: string }) {
    const res = await api.post('/auth/register', data)
    return res.data.data
  },
  async logout() {
    const res = await api.post('/auth/logout')
    return res.data
  },
  async refresh(refreshToken: string) {
    const res = await api.post('/auth/refresh', { refreshToken })
    return res.data.data
  }
}

// Visual Components API
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
