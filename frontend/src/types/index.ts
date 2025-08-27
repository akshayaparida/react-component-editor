// User types
export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  _count?: {
    components: number;
    favorites: number;
  };
}

// Authentication types
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    components: number;
  };
}

// Component types
export type Framework = 'react' | 'vue' | 'angular' | 'svelte';
export type Language = 'typescript' | 'javascript';

export interface Component {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  isTemplate: boolean;
  tags: string[];
  framework: Framework;
  language: Language;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  currentVersion: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  categoryId?: string;
  author: {
    id: string;
    username: string;
    name?: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
  versions?: ComponentVersion[];
  _count?: {
    versions: number;
    favorites: number;
  };
}

export interface ComponentVersion {
  id: string;
  version: string;
  changelog?: string;
  isLatest: boolean;
  isStable: boolean;
  jsxCode: string;
  cssCode?: string;
  propsSchema?: Record<string, any>;
  previewCode?: string;
  previewData?: Record<string, any>;
  dependencies?: Record<string, string>;
  createdAt: string;
  componentId: string;
}

// API types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: string[];
  timestamp: string;
}

// Query parameters
export interface ComponentFilters {
  search?: string;
  category?: string;
  tags?: string[];
  framework?: Framework;
  language?: Language;
  isPublic?: boolean;
  isTemplate?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'viewCount' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CategoryFilters {
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Form types
export interface CreateComponentForm {
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  isTemplate: boolean;
  tags: string[];
  framework: Framework;
  language: Language;
  categoryId?: string;
  version: string;
  jsxCode: string;
  cssCode?: string;
  propsSchema?: Record<string, any>;
  previewCode?: string;
  previewData?: Record<string, any>;
  dependencies?: Record<string, string>;
  changelog?: string;
}

export interface UpdateComponentForm {
  name?: string;
  description?: string;
  isPublic?: boolean;
  isTemplate?: boolean;
  tags?: string[];
  categoryId?: string;
}
