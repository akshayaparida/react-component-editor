import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  extractTokenFromHeader, 
  verifyAccessToken, 
  isTokenBlacklisted,
  JWTPayload 
} from '../utils/auth';
import { sendErrorResponse } from './validation';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        name?: string;
        avatar?: string;
      };
    }
  }
}

// Authentication middleware - requires valid JWT token
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return sendErrorResponse(res, 'Authentication Required', 'No authentication token provided', 401);
    }

    // Check if token is blacklisted (for logout functionality)
    if (isTokenBlacklisted(token)) {
      return sendErrorResponse(res, 'Invalid Token', 'Token has been revoked', 401);
    }

    // Verify the token
    let decoded: JWTPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
      return sendErrorResponse(res, 'Invalid Token', errorMessage, 401);
    }

    // Fetch user from database to ensure user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      return sendErrorResponse(res, 'User Not Found', 'User account no longer exists', 401);
    }

    // Verify token data matches database
    if (user.email !== decoded.email || user.username !== decoded.username) {
      return sendErrorResponse(res, 'Invalid Token', 'Token data mismatch', 401);
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      ...(user.name && { name: user.name }),
      ...(user.avatar && { avatar: user.avatar }),
    };
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return sendErrorResponse(res, 'Authentication Error', 'Authentication failed', 500);
  }
};

// Optional authentication middleware - doesn't require token but extracts user if provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      // No token provided, continue without user
      next();
      return;
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      next();
      return;
    }

    // Try to verify token
    let decoded: JWTPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      // Invalid token, continue without user
      next();
      return;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
      },
    });

    if (user && user.email === decoded.email && user.username === decoded.username) {
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        ...(user.name && { name: user.name }),
        ...(user.avatar && { avatar: user.avatar }),
      };
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Don't fail on optional auth errors, just continue
    next();
  }
};

// Authorization middleware - checks if user owns a resource
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return sendErrorResponse(res, 'Authentication Required', 'User not authenticated', 401);
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return sendErrorResponse(res, 'Bad Request', 'Resource ID not provided', 400);
      }

      // Check if user owns the component
      const component = await prisma.component.findUnique({
        where: { id: resourceId },
        select: { authorId: true },
      });

      if (!component) {
        return sendErrorResponse(res, 'Not Found', 'Resource not found', 404);
      }

      if (component.authorId !== req.user.id) {
        return sendErrorResponse(res, 'Forbidden', 'You do not have permission to access this resource', 403);
      }

      next();
    } catch (error) {
      console.error('Ownership middleware error:', error);
      return sendErrorResponse(res, 'Authorization Error', 'Authorization check failed', 500);
    }
  };
};

// Role-based authorization middleware (for future use)
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return sendErrorResponse(res, 'Authentication Required', 'User not authenticated', 401);
      }

      // For now, we'll assume all users have 'user' role
      // In the future, we can add roles to the user model
      const userRole = 'user';

      if (!roles.includes(userRole)) {
        return sendErrorResponse(res, 'Forbidden', 'Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return sendErrorResponse(res, 'Authorization Error', 'Role check failed', 500);
    }
  };
};

// Middleware to check if user can modify component version
export const requireVersionOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return sendErrorResponse(res, 'Authentication Required', 'User not authenticated', 401);
    }

    const { componentId } = req.params;
    if (!componentId) {
      return sendErrorResponse(res, 'Bad Request', 'Component ID not provided', 400);
    }

    // Check if user owns the component
    const component = await prisma.component.findUnique({
      where: { id: componentId },
      select: { authorId: true },
    });

    if (!component) {
      return sendErrorResponse(res, 'Not Found', 'Component not found', 404);
    }

    if (component.authorId !== req.user.id) {
      return sendErrorResponse(res, 'Forbidden', 'You do not have permission to modify this component', 403);
    }

    next();
  } catch (error) {
    console.error('Version ownership middleware error:', error);
    return sendErrorResponse(res, 'Authorization Error', 'Ownership check failed', 500);
  }
};

// Rate limiting middleware (basic implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      // Create new record or reset expired record
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }
    
    if (record.count >= maxRequests) {
      const resetIn = Math.ceil((record.resetTime - now) / 1000);
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
      });
      return sendErrorResponse(
        res, 
        'Rate Limit Exceeded', 
        `Too many requests. Please try again in ${resetIn} seconds.`, 
        429
      );
    }
    
    // Increment counter
    record.count++;
    rateLimitStore.set(key, record);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - record.count).toString(),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
    });
    
    next();
  };
};
