import { Channel, makeDmKey } from '../models/Channel.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export function toPublicChannel(channel) {
  return {
    id: channel._id.toString(),
    type: channel.type,
    name: channel.name,
    topic: channel.topic,
    isPrivate: channel.isPrivate,
    avatarUrl: channel.avatarUrl,
    lastMessageAt: channel.lastMessageAt,
    createdBy: channel.createdBy?.toString?.() ?? channel.createdBy,
    members: channel.members.map((m) => ({
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user && m.user._id
        ? {
            id: m.user._id.toString(),
            username: m.user.username,
            displayName: m.user.displayName,
            avatarUrl: m.user.avatarUrl,
          }
        : m.user?.toString?.() ?? m.user,
    })),
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt,
  };
}

export function isMember(channel, userId) {
  return channel.members.some((m) => {
    const id = m.user && m.user._id ? m.user._id.toString() : m.user.toString();
    return id === userId.toString();
  });
}

function memberRole(channel, userId) {
  const member = channel.members.find((m) => {
    const id = m.user && m.user._id ? m.user._id.toString() : m.user.toString();
    return id === userId.toString();
  });
  return member?.role ?? null;
}

export async function assertMemberChannel(userId, channelId) {
  const channel = await Channel.findById(channelId).populate('members.user', 'username displayName avatarUrl');
  if (!channel) {
    throw AppError.notFound('Channel not found');
  }
  if (!isMember(channel, userId)) {
    throw AppError.forbidden('You are not a member of this channel');
  }
  return channel;
}

export async function listUserChannels(userId) {
  const channels = await Channel.find({ 'members.user': userId })
    .sort({ lastMessageAt: -1 })
    .populate('members.user', 'username displayName avatarUrl');
  return channels.map(toPublicChannel);
}

export async function createChannel(userId, { type, name, topic, isPrivate, memberIds }) {
  const uniqueIds = Array.from(new Set([userId.toString(), ...memberIds.map(String)]));
  const validUsers = await User.find({ _id: { $in: uniqueIds } }).select('_id');
  if (validUsers.length !== uniqueIds.length) {
    throw AppError.badRequest('One or more member ids are invalid');
  }

  const members = uniqueIds.map((id) => ({
    user: id,
    role: id === userId.toString() ? 'owner' : 'member',
  }));

  const channel = await Channel.create({
    type,
    name,
    topic: topic ?? '',
    isPrivate: isPrivate ?? true,
    members,
    createdBy: userId,
  });

  await channel.populate('members.user', 'username displayName avatarUrl');
  return toPublicChannel(channel);
}

export async function getOrCreateDm(userId, otherUserId) {
  if (userId.toString() === otherUserId.toString()) {
    throw AppError.badRequest('Cannot start a DM with yourself');
  }

  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    throw AppError.notFound('User not found');
  }

  const dmKey = makeDmKey(userId, otherUserId);

  const channel = await Channel.findOneAndUpdate(
    { dmKey },
    {
      $setOnInsert: {
        type: 'dm',
        dmKey,
        isPrivate: true,
        members: [
          { user: userId, role: 'member' },
          { user: otherUserId, role: 'member' },
        ],
        createdBy: userId,
        lastMessageAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate('members.user', 'username displayName avatarUrl');

  return toPublicChannel(channel);
}

export async function patchChannel(userId, channelId, updates) {
  const channel = await assertMemberChannel(userId, channelId);
  if (channel.type === 'dm') {
    throw AppError.badRequest('DM channels cannot be edited');
  }
  const role = memberRole(channel, userId);
  if (role !== 'owner' && role !== 'admin') {
    throw AppError.forbidden('Only channel admins can edit this channel');
  }

  Object.assign(channel, updates);
  await channel.save();
  await channel.populate('members.user', 'username displayName avatarUrl');
  return toPublicChannel(channel);
}

export async function addMember(userId, channelId, newUserId) {
  const channel = await assertMemberChannel(userId, channelId);
  if (channel.type === 'dm') {
    throw AppError.badRequest('Cannot add members to a DM');
  }

  const newUser = await User.findById(newUserId);
  if (!newUser) {
    throw AppError.notFound('User not found');
  }

  if (isMember(channel, newUserId)) {
    throw AppError.conflict('User is already a member');
  }

  channel.members.push({ user: newUserId, role: 'member' });
  await channel.save();
  await channel.populate('members.user', 'username displayName avatarUrl');
  return toPublicChannel(channel);
}

export async function removeMember(userId, channelId, targetUserId) {
  const channel = await assertMemberChannel(userId, channelId);
  if (channel.type === 'dm') {
    throw AppError.badRequest('Cannot remove members from a DM');
  }

  const isSelf = userId.toString() === targetUserId.toString();
  const role = memberRole(channel, userId);
  if (!isSelf && role !== 'owner' && role !== 'admin') {
    throw AppError.forbidden('Only channel admins can remove other members');
  }

  channel.members = channel.members.filter((m) => {
    const id = m.user && m.user._id ? m.user._id.toString() : m.user.toString();
    return id !== targetUserId.toString();
  });
  await channel.save();
  await channel.populate('members.user', 'username displayName avatarUrl');
  return toPublicChannel(channel);
}

export async function touchLastMessageAt(channelId, date = new Date()) {
  await Channel.findByIdAndUpdate(channelId, { lastMessageAt: date });
}
