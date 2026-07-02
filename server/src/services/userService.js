import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { toPublicUser } from './authService.js';

export async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return toPublicUser(user);
}

export async function searchUsers(query, excludeUserId) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const regex = new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const users = await User.find({
    _id: { $ne: excludeUserId },
    $or: [{ username: regex }, { displayName: regex }],
  })
    .limit(20)
    .sort({ username: 1 });

  return users.map(toPublicUser);
}
