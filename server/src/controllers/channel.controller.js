import { catchAsync } from '../utils/catchAsync.js';
import { getIO } from '../sockets/ioAccessor.js';
import * as channelService from '../services/channelService.js';

function notifyMembers(channel, event, payload) {
  const io = getIO();
  channel.members.forEach((m) => {
    const userId = typeof m.user === 'object' ? m.user.id : m.user;
    io.to(`user:${userId}`).emit(event, payload);
  });
}

export const list = catchAsync(async (req, res) => {
  const channels = await channelService.listUserChannels(req.userId);
  res.json({ channels });
});

export const create = catchAsync(async (req, res) => {
  const channel = await channelService.createChannel(req.userId, req.body);
  notifyMembers(channel, 'channel:created', { channel });
  res.status(201).json({ channel });
});

export const startDm = catchAsync(async (req, res) => {
  const channel = await channelService.getOrCreateDm(req.userId, req.body.userId);
  notifyMembers(channel, 'channel:created', { channel });
  res.status(200).json({ channel });
});

export const getById = catchAsync(async (req, res) => {
  const channel = await channelService.assertMemberChannel(req.userId, req.params.id);
  res.json({ channel: channelService.toPublicChannel(channel) });
});

export const patch = catchAsync(async (req, res) => {
  const channel = await channelService.patchChannel(req.userId, req.params.id, req.body);
  notifyMembers(channel, 'channel:updated', { channel });
  res.json({ channel });
});

export const addMember = catchAsync(async (req, res) => {
  const channel = await channelService.addMember(req.userId, req.params.id, req.body.userId);
  notifyMembers(channel, 'channel:memberJoined', { channelId: channel.id, userId: req.body.userId });
  notifyMembers(channel, 'channel:updated', { channel });
  res.status(200).json({ channel });
});

export const removeMember = catchAsync(async (req, res) => {
  const channel = await channelService.removeMember(req.userId, req.params.id, req.params.userId);
  const io = getIO();
  io.to(`user:${req.params.userId}`).emit('channel:memberLeft', { channelId: channel.id, userId: req.params.userId });
  notifyMembers(channel, 'channel:updated', { channel });
  res.status(200).json({ channel });
});
