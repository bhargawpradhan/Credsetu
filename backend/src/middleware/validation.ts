import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        const primaryMessage = error.errors[0]?.message || 'Validation failed';
        res.status(400).json({
          success: false,
          message: primaryMessage,
          errors: errorMessages,
        });
        return;
      }
      next(error);
    }
  };
}
