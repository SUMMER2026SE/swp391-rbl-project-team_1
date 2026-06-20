import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error('Error Intercepted:', err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
    return;
  }

  // Handle Prisma Database Errors
  if (err.name === 'PrismaClientKnownRequestError') {
    // P2002 represents Unique constraint violation
    if (err.message.includes('P2002')) {
      res.status(409).json({
        success: false,
        message: 'A record with this unique field value already exists.'
      });
      return;
    }
    // P2025 represents Record not found
    if (err.message.includes('P2025')) {
      res.status(404).json({
        success: false,
        message: 'The requested record could not be found.'
      });
      return;
    }
  }

  // Fallback to 500 Internal Server Error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
}
