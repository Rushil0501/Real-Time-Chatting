import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message },
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: { code: 'DUPLICATE_KEY', message: 'Resource already exists' },
    });
  }

  console.error('[unhandled error]', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
}
