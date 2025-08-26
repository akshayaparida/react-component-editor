import { z } from 'zod';

// Base schemas for common patterns
export const IdSchema = z.string().cuid();
export const SlugSchema = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, {
  message: 'Slug must contain only lowercase letters, numbers, and hyphens',
});
export const TagsSchema = z.array(z.string().min(1).max(50)).max(10);
export const VersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/, {
  message: 'Version must follow semantic versioning (e.g., 1.0.0)',
});

// User validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  }),
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial();

// Category validation schemas
export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  slug: SlugSchema,
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color (e.g., #FF5733)',
  }).optional(),
  icon: z.string().min(1).max(50).optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// Component validation schemas
export const CreateComponentSchema = z.object({
  name: z.string().min(1).max(100),
  slug: SlugSchema,
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(false),
  isTemplate: z.boolean().default(false),
  tags: TagsSchema.default([]),
  framework: z.enum(['react', 'vue', 'angular', 'svelte']).default('react'),
  language: z.enum(['typescript', 'javascript']).default('typescript'),
  categoryId: IdSchema.optional(),
  
  // Initial version data
  version: VersionSchema.default('1.0.0'),
  jsxCode: z.string().min(1).max(50000),
  cssCode: z.string().max(50000).optional(),
  propsSchema: z.record(z.any()).optional(),
  previewCode: z.string().max(10000).optional(),
  previewData: z.record(z.any()).optional(),
  dependencies: z.record(z.string()).optional(),
  changelog: z.string().max(1000).optional(),
});

export const UpdateComponentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  tags: TagsSchema.optional(),
  categoryId: IdSchema.nullable().optional(),
});

// Component Version validation schemas
export const CreateVersionSchema = z.object({
  version: VersionSchema,
  changelog: z.string().max(1000).optional(),
  isStable: z.boolean().default(false),
  jsxCode: z.string().min(1).max(50000),
  cssCode: z.string().max(50000).optional(),
  propsSchema: z.record(z.any()).optional(),
  previewCode: z.string().max(10000).optional(),
  previewData: z.record(z.any()).optional(),
  dependencies: z.record(z.string()).optional(),
});

// Query parameter schemas
export const ComponentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: SlugSchema.optional(),
  tags: z.string().transform((str) => str.split(',').filter(Boolean)).optional(),
  framework: z.enum(['react', 'vue', 'angular', 'svelte']).optional(),
  language: z.enum(['typescript', 'javascript']).optional(),
  isPublic: z.coerce.boolean().optional(),
  isTemplate: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'viewCount', 'likeCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const UserQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'username', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const CategoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// API Response schemas
export const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  pages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const ApiResponseSchema = <T>(dataSchema: z.ZodType<T>) => z.object({
  success: z.boolean(),
  data: dataSchema,
  message: z.string().optional(),
  pagination: PaginationSchema.optional(),
});

export const ApiErrorSchema = z.object({
  success: z.boolean().default(false),
  error: z.string(),
  message: z.string(),
  details: z.array(z.string()).optional(),
  timestamp: z.string(),
});

// Type exports for TypeScript
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
export type CreateComponent = z.infer<typeof CreateComponentSchema>;
export type UpdateComponent = z.infer<typeof UpdateComponentSchema>;
export type CreateVersion = z.infer<typeof CreateVersionSchema>;
export type ComponentQuery = z.infer<typeof ComponentQuerySchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
export type CategoryQuery = z.infer<typeof CategoryQuerySchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ApiResponse<T> = z.infer<ReturnType<typeof ApiResponseSchema>>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
