import { catchAsync } from '../utils/catchAsync.js';
import { env } from '../config/env.js';
import { parseDurationToMs } from '../utils/time.js';
import * as authService from '../services/authService.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/auth';

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

export const register = catchAsync(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.register(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ accessToken, user });
});

export const login = catchAsync(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ accessToken, user });
});

export const refresh = catchAsync(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.refresh(req.cookies?.[REFRESH_COOKIE_NAME]);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ accessToken, user });
});

export const logout = catchAsync(async (req, res) => {
  clearRefreshCookie(res);
  res.status(204).send();
});
