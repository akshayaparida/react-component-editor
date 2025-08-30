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

// GET /api/v1/components - List user's own components (Dashboard)
router.get(
  '/',
  requireAuth, // Require authentication to see personal components
  // TODO: Re-enable query validation after fixing TypeScript issues
  // validateQuery(ComponentQuerySchema),
  asyncHandler(async (req: any, res: any) => {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      tags,
      framework,
      language,
      isPublic,
      isTemplate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Convert string values to appropriate types
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100); // Max 100 items per page

    // Build where clause - Only show current user's components
    const whereClause: any = {
      authorId: req.user.id // Filter by current user
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' }, authorId: req.user.id },
        { description: { contains: search, mode: 'insensitive' }, authorId: req.user.id },
        { tags: { hasSome: [search] }, authorId: req.user.id },
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
    if (isPublic !== undefined) whereClause.isPublic = isPublic === 'true';
    if (isTemplate !== undefined) whereClause.isTemplate = isTemplate === 'true';

    // Calculate offset
    const offset = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await prisma.component.count({ where: whereClause });

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy && ['createdAt', 'updatedAt', 'name', 'viewCount', 'downloadCount', 'likeCount'].includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

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
      orderBy,
      take: limitNum,
      skip: offset,
    });

    const pagination = calculatePagination(pageNum, limitNum, total);

    sendSuccessResponse(res, components, 'Components retrieved successfully', 200, pagination);
  })
);

// GET /api/v1/components/marketplace - List all public components (Marketplace)
router.get(
  '/marketplace',
  optionalAuth, // Optional auth to show user-specific data if logged in
  asyncHandler(async (req: any, res: any) => {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      tags,
      framework,
      language,
      isTemplate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Convert string values to appropriate types
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100); // Max 100 items per page

    // Build where clause - Only show public components
    const whereClause: any = {
      isPublic: true // Only show public components in marketplace
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' }, isPublic: true },
        { description: { contains: search, mode: 'insensitive' }, isPublic: true },
        { tags: { hasSome: [search] }, isPublic: true },
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
    if (isTemplate !== undefined) whereClause.isTemplate = isTemplate === 'true';

    // Calculate offset
    const offset = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await prisma.component.count({ where: whereClause });

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy && ['createdAt', 'updatedAt', 'name', 'viewCount', 'downloadCount', 'likeCount'].includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

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
      orderBy,
      take: limitNum,
      skip: offset,
    });

    const pagination = calculatePagination(pageNum, limitNum, total);

    sendSuccessResponse(res, components, 'Marketplace components retrieved successfully', 200, pagination);
  })
);

// GET /api/v1/components/stats - Get dashboard statistics
router.get(
  '/stats',
  optionalAuth,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user?.id;

    // Get total components count
    const totalComponents = await prisma.component.count({
      where: { isPublic: true }
    });

    // Get user's components count if authenticated
    const myComponents = userId ? await prisma.component.count({
      where: { authorId: userId }
    }) : 0;

    // Get recent updates (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUpdates = await prisma.component.count({
      where: {
        updatedAt: { gte: sevenDaysAgo },
        isPublic: true
      }
    });

    // Get total categories
    const totalCategories = await prisma.category.count();

    const stats = {
      total: totalComponents,
      myComponents,
      recentUpdates,
      categories: totalCategories
    };

    sendSuccessResponse(res, stats, 'Statistics retrieved successfully');
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

// GET /api/v1/components/:id/fork-status - Check if user has already forked this component
router.get(
  '/:id/fork-status',
  requireAuth, // Require authentication
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    
    // Get the original component
    const originalComponent = await prisma.component.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, authorId: true }
    });

    if (!originalComponent) {
      return sendErrorResponse(res, 'Not Found', 'Component not found', 404);
    }

    // Check if user has already forked this component
    const existingFork = await prisma.component.findFirst({
      where: {
        authorId: req.user.id,
        AND: [
          {
            tags: {
              has: 'forked'
            }
          },
          {
            OR: [
              {
                description: {
                  contains: `Forked from "${originalComponent.name}"`
                }
              },
              {
                name: {
                  contains: `${originalComponent.name} (Fork)`
                }
              },
              {
                slug: {
                  contains: `${originalComponent.slug}-fork`
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
      }
    });

    const forkStatus = {
      hasForked: !!existingFork,
      isOwnComponent: originalComponent.authorId === req.user.id,
      canFork: !existingFork && originalComponent.authorId !== req.user.id,
      existingFork: existingFork || null
    };

    sendSuccessResponse(res, forkStatus, 'Fork status retrieved successfully');
  })
);

// POST /api/v1/components/:id/fork - Fork/copy a component from marketplace
router.post(
  '/:id/fork',
  requireAuth, // Require authentication
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { name, slug, description } = req.body;
    
    // Get the original component
    const originalComponent = await prisma.component.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
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

    if (!originalComponent) {
      return sendErrorResponse(res, 'Not Found', 'Component not found', 404);
    }

    // Check if the component is public or if user owns it
    if (!originalComponent.isPublic && originalComponent.authorId !== req.user.id) {
      return sendErrorResponse(res, 'Forbidden', 'Cannot fork private component', 403);
    }

    // Check if user is trying to fork their own component
    if (originalComponent.authorId === req.user.id) {
      return sendErrorResponse(res, 'Bad Request', 'Cannot fork your own component', 400);
    }

    // Check if user has already forked this component
    // We'll check for existing forks by looking for components with specific patterns
    const existingFork = await prisma.component.findFirst({
      where: {
        authorId: req.user.id,
        AND: [
          {
            tags: {
              has: 'forked'
            }
          },
          {
            OR: [
              {
                description: {
                  contains: `Forked from "${originalComponent.name}"`
                }
              },
              {
                name: {
                  contains: `${originalComponent.name} (Fork)`
                }
              },
              {
                slug: {
                  contains: `${originalComponent.slug}-fork`
                }
              }
            ]
          }
        ]
      }
    });

    if (existingFork) {
      return sendErrorResponse(res, 'Already Forked', `You have already forked this component. Your fork: "${existingFork.name}"`, 409);
    }

    // Generate a unique slug if not provided
    const newSlug = slug || `${originalComponent.slug}-fork-${Date.now()}`;
    const newName = name || `${originalComponent.name} (Fork)`;

    // Check if slug already exists
    const existingComponent = await prisma.component.findUnique({
      where: { slug: newSlug },
    });

    if (existingComponent) {
      return sendErrorResponse(res, 'Duplicate Slug', 'A component with this slug already exists', 409);
    }

    const latestVersion = originalComponent.versions[0];
    if (!latestVersion) {
      return sendErrorResponse(res, 'No Version', 'Original component has no versions to fork', 400);
    }

    // Generate better description and changelog with author info
    const authorInfo = originalComponent.author?.username || originalComponent.author?.name || 'Unknown Author';
    const defaultDescription = description || `Forked from "${originalComponent.name}" by ${authorInfo}. ${originalComponent.description ? originalComponent.description : ''}`;
    const changelogText = `Initial fork from "${originalComponent.name}" v${latestVersion.version} by ${authorInfo}`;

    // Create forked component with initial version in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the forked component
      const forkedComponent = await tx.component.create({
        data: {
          name: newName,
          slug: newSlug,
          description: defaultDescription.trim(),
          isPublic: false, // Forked components start as private
          isTemplate: originalComponent.isTemplate,
          tags: [...originalComponent.tags, 'forked'], // Add 'forked' tag
          framework: originalComponent.framework,
          language: originalComponent.language,
          authorId: req.user.id,
          categoryId: originalComponent.categoryId,
        },
      });

      // Create the initial version from the original
      const forkedVersion = await tx.componentVersion.create({
        data: {
          componentId: forkedComponent.id,
          authorId: req.user.id,
          version: '1.0.0', // Start with version 1.0.0 for forks
          changelog: changelogText,
          isStable: false,
          isLatest: true,
          jsxCode: latestVersion.jsxCode,
          cssCode: latestVersion.cssCode,
          propsSchema: latestVersion.propsSchema,
          previewCode: latestVersion.previewCode,
          previewData: latestVersion.previewData,
          dependencies: latestVersion.dependencies,
        },
      });

      return { component: forkedComponent, version: forkedVersion };
    });

    // Increment download count for the original component
    await prisma.component.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    // Fetch the complete forked component data to return
    const forkedComponent = await prisma.component.findUnique({
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

    sendSuccessResponse(res, forkedComponent, 'Component forked successfully', 201);
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
