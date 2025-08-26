import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/validation';

// Validation middleware factory
export const validateRequest = <T>(schema: z.ZodSchema<T>, location: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = location === 'body' ? req.body : location === 'query' ? req.query : req.params;
      const result = schema.safeParse(data);

      if (!result.success) {
        const errorDetails = result.error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        );

        const errorResponse: ApiError = {
          success: false,
          error: 'Validation Error',
          message: 'Invalid request data',
          details: errorDetails,
          timestamp: new Date().toISOString(),
        };

        res.status(400).json(errorResponse);
        return;
      }

      // Attach parsed data to request
      if (location === 'body') {
        req.body = result.data;
      } else if (location === 'query') {
        req.query = result.data as any;
      } else {
        req.params = result.data as any;
      }

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      
      const errorResponse: ApiError = {
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred during validation',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  };
};

// Helper to validate path parameters
export const validateParams = <T>(schema: z.ZodSchema<T>) => 
  validateRequest(schema, 'params');

// Helper to validate query parameters
export const validateQuery = <T>(schema: z.ZodSchema<T>) => 
  validateRequest(schema, 'query');

// Helper to validate request body
export const validateBody = <T>(schema: z.ZodSchema<T>) => 
  validateRequest(schema, 'body');

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error class for API errors
export class ApiErrorException extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response helper
export const sendErrorResponse = (res: Response, error: string, message: string, statusCode: number = 400, details?: string[]) => {
  const errorResponse: ApiError = {
    success: false,
    error,
    message,
    details,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(errorResponse);
};

// Success response helper
export const sendSuccessResponse = <T>(
  res: Response, 
  data: T, 
  message?: string, 
  statusCode: number = 200,
  pagination?: any
) => {
  const response = {
    success: true,
    data,
    message,
    ...(pagination && { pagination }),
  };

  res.status(statusCode).json(response);
};

// Pagination helper
export const calculatePagination = (page: number, limit: number, total: number) => {
  const pages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
};
