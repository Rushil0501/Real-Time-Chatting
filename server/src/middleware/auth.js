import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(AppError.unauthorized('Missing access token'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired access token'));
  }
}
