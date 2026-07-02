import { catchAsync } from '../utils/catchAsync.js';
import * as userService from '../services/userService.js';

export const getMe = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.userId);
  res.json({ user });
});

export const search = catchAsync(async (req, res) => {
  const users = await userService.searchUsers(req.query.q, req.userId);
  res.json({ users });
});
