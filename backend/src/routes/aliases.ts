import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'

const router: Router = Router()
const prisma = new PrismaClient()

// Validation schemas (aligned with visual-components)
const createSchema = z.object({
  name: z.string().optional(),
  jsxCode: z.string().min(1, 'JSX code is required'),
  description: z.string().optional(),
})

const updateSchema = z.object({
  name: z.string().optional(),
  jsxCode: z.string().min(1, 'JSX code is required').optional(),
  description: z.string().optional(),
})

// POST /api/v1/component - Create a new component (alias)
router.post('/component', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body)
    const name = data.name || `Component_${Date.now()}`

    const component = await prisma.visualComponent.create({
      data: {
        name,
        jsxCode: data.jsxCode,
        description: data.description ?? null,
        framework: 'react',
        language: 'javascript',
        owner: { connect: { id: (req as any).user.id } },
      },
    })

    return res.status(201).json({
      success: true,
      data: component,
      message: 'Component created successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.errors,
        timestamp: new Date().toISOString(),
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create component',
      timestamp: new Date().toISOString(),
    })
  }
})

// GET /api/v1/preview/:id - Fetch component by id (alias)
router.get('/preview/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const component = await prisma.visualComponent.findUnique({ where: { id } })

    if (!component) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Component not found',
        timestamp: new Date().toISOString(),
      })
    }

    // Increment view count (non-blocking)
    await prisma.visualComponent.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return res.json({
      success: true,
      data: component,
      message: 'Component retrieved successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve component',
      timestamp: new Date().toISOString(),
    })
  }
})

// PUT /api/v1/component/:id - Update component (alias)
router.put('/component/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const data = updateSchema.parse(req.body)

    const existing = await prisma.visualComponent.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Component not found',
        timestamp: new Date().toISOString(),
      })
    }

    const updateData: any = { updatedAt: new Date() }
    if (typeof data.jsxCode !== 'undefined') updateData.jsxCode = data.jsxCode
    if (typeof data.name !== 'undefined') updateData.name = data.name
    if (typeof data.description !== 'undefined') updateData.description = data.description ?? null

    const updated = await prisma.visualComponent.update({
      where: { id },
      data: updateData,
    })

    return res.json({
      success: true,
      data: updated,
      message: 'Component updated successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.errors,
        timestamp: new Date().toISOString(),
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update component',
      timestamp: new Date().toISOString(),
    })
  }
})

export default router
