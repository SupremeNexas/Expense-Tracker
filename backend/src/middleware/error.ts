import { Request, Response, NextFunction } from 'express';

/**
 * Centralized unhandled error handling middleware.
 * Logs full errors to console for developer diagnostics.
 * Returns consistent 500 JSON response without leaking stack traces.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);

  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(err.status || 500).json({
    error: isProduction ? 'Internal server error' : (err.message || 'Internal server error'),
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
