import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const SALT_ROUNDS = 12;

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    lastSeenAt: user.lastSeenAt,
  };
}

export async function register({ username, displayName, email, password }) {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw AppError.conflict('Username or email already in use');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ username, displayName, email, passwordHash });

  return issueTokens(user);
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  return issueTokens(user);
}

export async function refresh(refreshToken) {
  if (!refreshToken) {
    throw AppError.unauthorized('Missing refresh token');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw AppError.unauthorized('User no longer exists');
  }

  return issueTokens(user);
}

function issueTokens(user) {
  return {
    accessToken: signAccessToken(user._id.toString()),
    refreshToken: signRefreshToken(user._id.toString()),
    user: toPublicUser(user),
  };
}

export { toPublicUser };
