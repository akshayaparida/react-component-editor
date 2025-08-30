import axios from 'axios';
import type { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials,
  Component,
  ComponentFilters,
  Category,
  CategoryFilters,
  ApiResponse,
  PaginationMeta
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const tokenManager = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token: string) => localStorage.setItem('token', token),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setRefreshToken: (token: string) => localStorage.setItem('refreshToken', token),
  clearTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await api.post('/auth/refresh', {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        tokenManager.setToken(accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await api.post<ApiResponse<{ token: string }>>('/auth/refresh', {
      refreshToken,
    });
    return response.data.data;
  },

  getProfile: async () => {
    const response = await api.get<ApiResponse<any>>('/auth/me');
    return response.data.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.put<ApiResponse<any>>('/auth/change-password', data);
    return response.data.data;
  },
};

// Components API
export const componentsApi = {
  getAll: async (filters: ComponentFilters = {}): Promise<{
    data: Component[];
    pagination: PaginationMeta;
  }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await api.get<ApiResponse<Component[]>>(`/components?${params}`);
    return {
      data: response.data.data,
      pagination: response.data.pagination!,
    };
  },

  getById: async (id: string): Promise<Component> => {
    const response = await api.get<ApiResponse<Component>>(`/components/${id}`);
    return response.data.data;
  },

  getBySlug: async (slug: string): Promise<Component> => {
    const response = await api.get<ApiResponse<Component>>(`/components/slug/${slug}`);
    return response.data.data;
  },

  create: async (data: any): Promise<Component> => {
    const response = await api.post<ApiResponse<Component>>('/components', data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<Component> => {
    const response = await api.put<ApiResponse<Component>>(`/components/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/components/${id}`);
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (filters: CategoryFilters = {}): Promise<{
    data: Category[];
    pagination: PaginationMeta;
  }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await api.get<ApiResponse<Category[]>>(`/categories?${params}`);
    return {
      data: response.data.data,
      pagination: response.data.pagination!,
    };
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data;
  },

  getBySlug: async (slug: string): Promise<Category> => {
    const response = await api.get<ApiResponse<Category>>(`/categories/slug/${slug}`);
    return response.data.data;
  },

  getComponents: async (id: string, filters: ComponentFilters = {}): Promise<{
    category: Category;
    components: Component[];
    pagination: PaginationMeta;
  }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await api.get<ApiResponse<{
      category: Category;
      components: Component[];
    }>>(`/categories/${id}/components?${params}`);
    
    return {
      ...response.data.data,
      pagination: response.data.pagination!,
    };
  },
};
