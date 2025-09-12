import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  error: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
    return;
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          error: 'Unique constraint violation',
          details: error.meta,
        });
        return;
      case 'P2025':
        res.status(404).json({
          success: false,
          error: 'Record not found',
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: 'Database error',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
        return;
    }
  }

  // Custom API errors
  if (error.statusCode) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      details: error.details,
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
};

export const createError = (message: string, statusCode: number, details?: any): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
};