import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CreateComponentSchema,
  UpdateComponentSchema,
  CreateVersionSchema,
  ComponentQuerySchema,
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
  ApiErrorException,
} from '../middleware/validation';
import { requireAuth, optionalAuth, requireOwnership } from '../middleware/auth';

const router: Router = Router();
const prisma = new PrismaClient();

// GET /api/v1/components - List components with filtering and pagination
router.get(
  '/',
  optionalAuth, // Optional auth to show user-specific data if logged in
  // TODO: Re-enable query validation after fixing TypeScript issues
  // validateQuery(ComponentQuerySchema),
  asyncHandler(async (req: any, res: any) => {
    const {
      page,
      limit,
      search,
      category,
      tags,
      framework,
      language,
      isPublic,
      isTemplate,
      sortBy,
      sortOrder,
    } = req.query;

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (category) {
      whereClause.category = { slug: category };
    }

    if (tags && tags.length > 0) {
      whereClause.tags = { hasSome: tags };
    }

    if (framework) whereClause.framework = framework;
    if (language) whereClause.language = language;
    if (isPublic !== undefined) whereClause.isPublic = isPublic;
    if (isTemplate !== undefined) whereClause.isTemplate = isTemplate;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count for pagination
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
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

    sendSuccessResponse(res, components, 'Components retrieved successfully', 200, pagination);
  })
);

// POST /api/v1/components - Create a new component
router.post(
  '/',
  requireAuth, // Require authentication for creating components
  validateBody(CreateComponentSchema),
  asyncHandler(async (req: any, res: any) => {
    const {
      name,
      slug,
      description,
      isPublic,
      isTemplate,
      tags,
      framework,
      language,
      categoryId,
      version,
      jsxCode,
      cssCode,
      propsSchema,
      previewCode,
      previewData,
      dependencies,
      changelog,
    } = req.body;

    // Get authorId from authenticated user
    const authorId = req.user.id;

    // Check if slug already exists
    const existingComponent = await prisma.component.findUnique({
      where: { slug },
    });

    if (existingComponent) {
      return sendErrorResponse(res, 'Duplicate Slug', 'A component with this slug already exists', 409);
    }

    // Validate category exists if provided
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!categoryExists) {
        return sendErrorResponse(res, 'Invalid Category', 'The specified category does not exist', 400);
      }
    }

    // Create component with initial version in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the component
      const component = await tx.component.create({
        data: {
          name,
          slug,
          description,
          isPublic,
          isTemplate,
          tags,
          framework,
          language,
          authorId,
          categoryId,
        },
      });

      // Create the initial version
      const componentVersion = await tx.componentVersion.create({
        data: {
          componentId: component.id,
          authorId,
          version,
          changelog,
          isStable: false,
          isLatest: true,
          jsxCode,
          cssCode,
          propsSchema,
          previewCode,
          previewData,
          dependencies,
        },
      });

      return { component, version: componentVersion };
    });

    // Fetch the complete component data to return
    const createdComponent = await prisma.component.findUnique({
      where: { id: result.component.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
        versions: {
          where: { isLatest: true },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    sendSuccessResponse(res, createdComponent, 'Component created successfully', 201);
  })
);

// GET /api/v1/components/:id - Get a specific component
router.get(
  '/:id',
  optionalAuth, // Optional auth for view tracking
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    const component = await prisma.component.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
        versions: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            versions: true,
            favorites: true,
          },
        },
      },
    });

    if (!component) {
      return sendErrorResponse(res, 'Not Found', 'Component not found', 404);
    }

    // Increment view count
    await prisma.component.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    sendSuccessResponse(res, component, 'Component retrieved successfully');
  })
);

// PUT /api/v1/components/:id - Update a component
router.put(
  '/:id',
  requireAuth, // Require authentication
  requireOwnership(), // Require component ownership
  validateBody(UpdateComponentSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const updateData = req.body;

    // Ownership check is handled by middleware
    // Component existence is verified by ownership middleware

    // Validate category if provided
    if (updateData.categoryId !== undefined && updateData.categoryId !== null) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: updateData.categoryId },
      });

      if (!categoryExists) {
        return sendErrorResponse(res, 'Invalid Category', 'The specified category does not exist', 400);
      }
    }

    // Update the component
    const updatedComponent = await prisma.component.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
        versions: {
          where: { isLatest: true },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    sendSuccessResponse(res, updatedComponent, 'Component updated successfully');
  })
);

// DELETE /api/v1/components/:id - Delete a component
router.delete(
  '/:id',
  requireAuth, // Require authentication
  requireOwnership(), // Require component ownership
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    // Ownership check is handled by middleware
    // Component existence is verified by ownership middleware

    // Delete the component (cascade will handle versions and dependencies)
    await prisma.component.delete({
      where: { id },
    });

    sendSuccessResponse(res, { id }, 'Component deleted successfully');
  })
);

export default router;
