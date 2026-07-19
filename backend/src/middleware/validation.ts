import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Centralized validation middleware.
 * Inspects request for validation results from express-validator.
 * Returns consistent 400 response with structured errors if validations fail.
 */
export const validate = (req: any, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e: any) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};
