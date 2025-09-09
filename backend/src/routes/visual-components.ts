import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const router: Router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createVisualComponentSchema = z.object({
  name: z.string().optional(),
  jsxCode: z.string().min(1, 'JSX code is required'),
  description: z.string().optional(),
  framework: z.string().default('react'),
  language: z.string().default('javascript'),
});

const updateVisualComponentSchema = z.object({
  name: z.string().optional(),
  jsxCode: z.string().min(1, 'JSX code is required').optional(),
  description: z.string().optional(),
});

// POST /api/v1/visual-components - Create a new visual component (auth required)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('[Visual Components] Creating new component:', {
      bodySize: JSON.stringify(req.body).length,
      hasJsxCode: !!req.body.jsxCode
    });

    // Validate request body
    const validatedData = createVisualComponentSchema.parse(req.body);
    
    // Auto-generate name if not provided
    const name = validatedData.name || `Component_${Date.now()}`;

    // Create the component with ownerId
    const component = await (prisma as any).visualComponent.create({
      data: {
        name,
        jsxCode: validatedData.jsxCode,
        description: validatedData.description,
        framework: validatedData.framework,
        language: validatedData.language,
        ownerId: (req as any).user.id,
      },
    });

    console.log('[Visual Components] Created component:', component.id);

    return res.status(201).json({
      success: true,
      data: component,
      message: 'Visual component created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Visual Components] Create error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create visual component',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/visual-components/:id - Get a visual component by ID (auth + ownership required)
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('[Visual Components] Fetching component:', id);

    // Find the component
    const component = await (prisma as any).visualComponent.findUnique({
      where: { id },
    });

    if (!component) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Visual component not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Ownership check
    if (!component.ownerId || component.ownerId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have access to this component',
        timestamp: new Date().toISOString(),
      });
    }

    // Increment view count and return updated doc (handle mock env without Prisma increment)
    const updatedComponent = await (prisma as any).visualComponent.update({
      where: { id },
      data: { viewCount: (component.viewCount || 0) + 1 },
    });

    console.log('[Visual Components] Found component:', {
      id: updatedComponent.id,
      name: updatedComponent.name,
      viewCount: updatedComponent.viewCount
    });

    return res.json({
      success: true,
      data: updatedComponent,
      message: 'Visual component retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Visual Components] Get error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve visual component',
      timestamp: new Date().toISOString(),
    });
  }
});

// PUT /api/v1/visual-components/:id - Update a visual component (auth + ownership required)
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log('[Visual Components] Updating component:', id, {
      bodySize: JSON.stringify(req.body).length
    });

    // Validate request body
    const validatedData = updateVisualComponentSchema.parse(req.body);

    // Check if component exists
    const existingComponent = await (prisma as any).visualComponent.findUnique({
      where: { id },
    });

    if (!existingComponent) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Visual component not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Ownership check
    if (!existingComponent.ownerId || existingComponent.ownerId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to update this component',
        timestamp: new Date().toISOString(),
      });
    }

    // Update the component
    const updatedComponent = await (prisma as any).visualComponent.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    console.log('[Visual Components] Updated component:', updatedComponent.id);

    return res.json({
      success: true,
      data: updatedComponent,
      message: 'Visual component updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Visual Components] Update error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update visual component',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/v1/visual-components - List current user's visual components (auth required)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);
    const search = (req.query.search as string) || '';

    const where: any = { ownerId: (req as any).user.id };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const components = await (prisma as any).visualComponent.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        // Do not include jsxCode in list response
      },
    });

    return res.json({
      success: true,
      data: components,
      pagination: {
        total: components.length,
        limit,
      },
      message: 'Visual components retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Visual Components] List error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve visual components',
      timestamp: new Date().toISOString(),
    });
  }
});

// DELETE /api/v1/visual-components/:id - Delete a visual component (for cleanup)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    console.log('[Visual Components] Deleting component:', id);

    // Check if component exists
    const existingComponent = await (prisma as any).visualComponent.findUnique({
      where: { id },
    });

    if (!existingComponent) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Visual component not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Delete the component
    await (prisma as any).visualComponent.delete({
      where: { id },
    });

    console.log('[Visual Components] Deleted component:', id);

    return res.json({
      success: true,
      message: 'Visual component deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Visual Components] Delete error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete visual component',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
