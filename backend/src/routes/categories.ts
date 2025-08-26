import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryQuerySchema,
  IdSchema,
} from '../utils/validation';
import {
  validateBody,
  validateQuery,
  validateParams,
  asyncHandler,
  sendSuccessResponse,
  sendErrorResponse,
  calculatePagination,
} from '../middleware/validation';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth';

const router: Router = Router();
const prisma = new PrismaClient();

// GET /api/v1/categories - List categories with filtering and pagination
router.get(
  '/',
  optionalAuth, // Optional auth to show user-specific data
  asyncHandler(async (req: any, res: any) => {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    // Build where clause for search
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.category.count({ where: whereClause });

    // Fetch categories with component counts
    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            components: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    });

    const pagination = calculatePagination(page, limit, total);

    sendSuccessResponse(res, categories, 'Categories retrieved successfully', 200, pagination);
  })
);

// POST /api/v1/categories - Create a new category (admin only)
router.post(
  '/',
  requireAuth,
  requireRole(['admin']), // Only admins can create categories
  validateBody(CreateCategorySchema),
  asyncHandler(async (req: any, res: any) => {
    const { name, slug, description, color, icon } = req.body;

    // Check if slug already exists
    const existingSlug = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return sendErrorResponse(res, 'Duplicate Slug', 'A category with this slug already exists', 409);
    }

    // Check if name already exists
    const existingName = await prisma.category.findUnique({
      where: { name },
    });

    if (existingName) {
      return sendErrorResponse(res, 'Duplicate Name', 'A category with this name already exists', 409);
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        color,
        icon,
      },
      include: {
        _count: {
          select: {
            components: true,
          },
        },
      },
    });

    sendSuccessResponse(res, category, 'Category created successfully', 201);
  })
);

// GET /api/v1/categories/stats - Get category statistics (admin only)
router.get(
  '/stats',
  requireAuth,
  requireRole(['admin']),
  asyncHandler(async (req: any, res: any) => {
    // Get category statistics
    const categoryStats = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        icon: true,
        createdAt: true,
        _count: {
          select: {
            components: true,
          },
        },
        components: {
          select: {
            viewCount: true,
            likeCount: true,
            downloadCount: true,
          },
        },
      },
    });

    // Calculate additional statistics
    const stats = categoryStats.map((category) => {
      const totalViews = category.components.reduce((sum, comp) => sum + comp.viewCount, 0);
      const totalLikes = category.components.reduce((sum, comp) => sum + comp.likeCount, 0);
      const totalDownloads = category.components.reduce((sum, comp) => sum + comp.downloadCount, 0);

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        color: category.color,
        icon: category.icon,
        createdAt: category.createdAt,
        componentCount: category._count.components,
        totalViews,
        totalLikes,
        totalDownloads,
        avgViewsPerComponent: category._count.components > 0 ? Math.round(totalViews / category._count.components) : 0,
      };
    });

    // Sort by component count descending
    stats.sort((a, b) => b.componentCount - a.componentCount);

    sendSuccessResponse(res, stats, 'Category statistics retrieved successfully');
  })
);

// GET /api/v1/categories/:id - Get a specific category
router.get(
  '/:id',
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            components: true,
          },
        },
        components: {
          where: { isPublic: true }, // Only show public components
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            tags: true,
            framework: true,
            language: true,
            viewCount: true,
            likeCount: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
            versions: {
              where: { isLatest: true },
              select: {
                id: true,
                version: true,
                isStable: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit to 10 most recent components
        },
      },
    });

    if (!category) {
      return sendErrorResponse(res, 'Not Found', 'Category not found', 404);
    }

    sendSuccessResponse(res, category, 'Category retrieved successfully');
  })
);

// GET /api/v1/categories/slug/:slug - Get category by slug
router.get(
  '/slug/:slug',
  asyncHandler(async (req: any, res: any) => {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            components: true,
          },
        },
        components: {
          where: { isPublic: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            tags: true,
            framework: true,
            language: true,
            viewCount: true,
            likeCount: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
            versions: {
              where: { isLatest: true },
              select: {
                id: true,
                version: true,
                isStable: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!category) {
      return sendErrorResponse(res, 'Not Found', 'Category not found', 404);
    }

    sendSuccessResponse(res, category, 'Category retrieved successfully');
  })
);

// PUT /api/v1/categories/:id - Update a category (admin only)
router.put(
  '/:id',
  requireAuth,
  requireRole(['admin']),
  validateBody(UpdateCategorySchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return sendErrorResponse(res, 'Not Found', 'Category not found', 404);
    }

    // Check for slug conflicts if slug is being updated
    if (updateData.slug && updateData.slug !== existingCategory.slug) {
      const conflictingSlug = await prisma.category.findUnique({
        where: { slug: updateData.slug },
      });

      if (conflictingSlug) {
        return sendErrorResponse(res, 'Duplicate Slug', 'A category with this slug already exists', 409);
      }
    }

    // Check for name conflicts if name is being updated
    if (updateData.name && updateData.name !== existingCategory.name) {
      const conflictingName = await prisma.category.findUnique({
        where: { name: updateData.name },
      });

      if (conflictingName) {
        return sendErrorResponse(res, 'Duplicate Name', 'A category with this name already exists', 409);
      }
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            components: true,
          },
        },
      },
    });

    sendSuccessResponse(res, updatedCategory, 'Category updated successfully');
  })
);

// DELETE /api/v1/categories/:id - Delete a category (admin only)
router.delete(
  '/:id',
  requireAuth,
  requireRole(['admin']),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            components: true,
          },
        },
      },
    });

    if (!category) {
      return sendErrorResponse(res, 'Not Found', 'Category not found', 404);
    }

    // Check if category has components
    if (category._count.components > 0) {
      return sendErrorResponse(
        res,
        'Category In Use',
        `Cannot delete category with ${category._count.components} components. Please move or delete components first.`,
        409
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id },
    });

    sendSuccessResponse(res, { id }, 'Category deleted successfully');
  })
);

// GET /api/v1/categories/:id/components - Get components in a category
router.get(
  '/:id/components',
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      framework,
      language,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Check if category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id },
    });

    if (!categoryExists) {
      return sendErrorResponse(res, 'Not Found', 'Category not found', 404);
    }

    // Build where clause
    const whereClause: any = {
      categoryId: id,
      isPublic: true, // Only show public components
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (framework) whereClause.framework = framework;
    if (language) whereClause.language = language;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const total = await prisma.component.count({ where: whereClause });

    // Fetch components
    const components = await prisma.component.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        versions: {
          where: { isLatest: true },
          select: {
            id: true,
            version: true,
            isStable: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            versions: true,
            favorites: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    });

    const pagination = calculatePagination(page, limit, total);

    const response = {
      category: categoryExists,
      components,
    };

    sendSuccessResponse(res, response, 'Category components retrieved successfully', 200, pagination);
  })
);

export default router;
