import { AppError } from '../utils/AppError.js';

// Wraps a zod schema into an Express middleware that validates req.body
// and replaces it with the parsed (defaulted/coerced) result.
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(AppError.badRequest('Validation failed', result.error.flatten().fieldErrors));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(AppError.badRequest('Validation failed', result.error.flatten().fieldErrors));
    }
    req.query = result.data;
    next();
  };
}
