export class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message, details) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Not found') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Conflict') {
    return new AppError(409, 'CONFLICT', message);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new AppError(429, 'TOO_MANY_REQUESTS', message);
  }
}
