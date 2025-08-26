import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  CreateVersionSchema,
  IdSchema,
} from '../utils/validation';
import {
  validateBody,
  validateParams,
  asyncHandler,
  sendSuccessResponse,
  sendErrorResponse,
} from '../middleware/validation';

const router: Router = Router();
const prisma = new PrismaClient();

// POST /api/v1/components/:componentId/versions - Create a new version
router.post(
  '/:componentId/versions',
  validateBody(CreateVersionSchema),
  asyncHandler(async (req: any, res: any) => {
    const { componentId } = req.params;
    const versionData = req.body;

    // TODO: Get authorId from authentication middleware
    const authorId = 'temp-user-id';

    // Check if component exists
    const component = await prisma.component.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      return sendErrorResponse(res, 'Not Found', 'Component not found', 404);
    }

    // TODO: Check if user owns this component

    // Check if version already exists
    const existingVersion = await prisma.componentVersion.findUnique({
      where: {
        componentId_version: {
          componentId,
          version: versionData.version,
        },
      },
    });

    if (existingVersion) {
      return sendErrorResponse(res, 'Duplicate Version', 'This version already exists for the component', 409);
    }

    // Create new version in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // If this is marked as latest, update previous latest version
      if (versionData.isLatest !== false) {
        await tx.componentVersion.updateMany({
          where: {
            componentId,
            isLatest: true,
          },
          data: {
            isLatest: false,
          },
        });
      }

      // Create the new version
      const newVersion = await tx.componentVersion.create({
        data: {
          ...versionData,
          componentId,
          authorId,
          isLatest: versionData.isLatest !== false, // Default to true unless explicitly false
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          component: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // Update component's updated timestamp
      await tx.component.update({
        where: { id: componentId },
        data: { updatedAt: new Date() },
      });

      return newVersion;
    });

    sendSuccessResponse(res, result, 'Component version created successfully', 201);
  })
);

// GET /api/v1/components/:componentId/versions - Get all versions of a component
router.get(
  '/:componentId/versions',
  asyncHandler(async (req: any, res: any) => {
    const { componentId } = req.params;

    // Check if component exists
    const component = await prisma.component.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      return sendErrorResponse(res, 'Not Found', 'Component not found', 404);
    }

    const versions = await prisma.componentVersion.findMany({
      where: { componentId },
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
    });

    sendSuccessResponse(res, versions, 'Component versions retrieved successfully');
  })
);

// GET /api/v1/components/:componentId/versions/:version - Get specific version
router.get(
  '/:componentId/versions/:version',
  asyncHandler(async (req: any, res: any) => {
    const { componentId, version } = req.params;

    const componentVersion = await prisma.componentVersion.findUnique({
      where: {
        componentId_version: {
          componentId,
          version,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        component: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!componentVersion) {
      return sendErrorResponse(res, 'Not Found', 'Component version not found', 404);
    }

    sendSuccessResponse(res, componentVersion, 'Component version retrieved successfully');
  })
);

// PUT /api/v1/components/:componentId/versions/:version/publish - Mark version as stable
router.put(
  '/:componentId/versions/:version/publish',
  asyncHandler(async (req: any, res: any) => {
    const { componentId, version } = req.params;

    // TODO: Check if user owns this component

    const componentVersion = await prisma.componentVersion.findUnique({
      where: {
        componentId_version: {
          componentId,
          version,
        },
      },
    });

    if (!componentVersion) {
      return sendErrorResponse(res, 'Not Found', 'Component version not found', 404);
    }

    // Mark as stable and latest
    const updatedVersion = await prisma.$transaction(async (tx) => {
      // Update other versions to not be latest if this becomes latest
      await tx.componentVersion.updateMany({
        where: {
          componentId,
          isLatest: true,
        },
        data: {
          isLatest: false,
        },
      });

      // Update this version
      const updated = await tx.componentVersion.update({
        where: {
          componentId_version: {
            componentId,
            version,
          },
        },
        data: {
          isStable: true,
          isLatest: true,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          component: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      return updated;
    });

    sendSuccessResponse(res, updatedVersion, 'Version published successfully');
  })
);

// DELETE /api/v1/components/:componentId/versions/:version - Delete a version
router.delete(
  '/:componentId/versions/:version',
  asyncHandler(async (req: any, res: any) => {
    const { componentId, version } = req.params;

    // TODO: Check if user owns this component

    const componentVersion = await prisma.componentVersion.findUnique({
      where: {
        componentId_version: {
          componentId,
          version,
        },
      },
    });

    if (!componentVersion) {
      return sendErrorResponse(res, 'Not Found', 'Component version not found', 404);
    }

    // Don't allow deleting the only version
    const versionCount = await prisma.componentVersion.count({
      where: { componentId },
    });

    if (versionCount <= 1) {
      return sendErrorResponse(res, 'Cannot Delete', 'Cannot delete the only version of a component', 400);
    }

    await prisma.$transaction(async (tx) => {
      // Delete the version
      await tx.componentVersion.delete({
        where: {
          componentId_version: {
            componentId,
            version,
          },
        },
      });

      // If this was the latest version, mark the most recent remaining version as latest
      if (componentVersion.isLatest) {
        const latestVersion = await tx.componentVersion.findFirst({
          where: { componentId },
          orderBy: { createdAt: 'desc' },
        });

        if (latestVersion) {
          await tx.componentVersion.update({
            where: { id: latestVersion.id },
            data: { isLatest: true },
          });
        }
      }
    });

    sendSuccessResponse(res, { componentId, version }, 'Version deleted successfully');
  })
);

export default router;
