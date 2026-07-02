import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { ReadState } from '../models/ReadState.js';
import { AppError } from '../utils/AppError.js';
import { assertMemberChannel, touchLastMessageAt } from './channelService.js';

export function toPublicMessage(message) {
  const isDeleted = Boolean(message.deletedAt);
  return {
    id: message._id.toString(),
    channelId: message.channel.toString(),
    senderId: message.sender.toString(),
    content: isDeleted ? '' : message.content,
    attachments: isDeleted ? [] : message.attachments,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

export async function sendMessage(userId, { channelId, content, attachments, clientTempId }) {
  await assertMemberChannel(userId, channelId);

  if ((!content || content.trim().length === 0) && (!attachments || attachments.length === 0)) {
    throw AppError.badRequest('Message must have content or an attachment');
  }

  const message = await Message.create({
    channel: channelId,
    sender: userId,
    content: content ?? '',
    attachments: attachments ?? [],
  });

  await touchLastMessageAt(channelId, message.createdAt);

  return { message: toPublicMessage(message), clientTempId };
}

export async function editMessage(userId, { messageId, content }) {
  const message = await Message.findById(messageId);
  if (!message || message.deletedAt) {
    throw AppError.notFound('Message not found');
  }
  if (message.sender.toString() !== userId.toString()) {
    throw AppError.forbidden('You can only edit your own messages');
  }

  message.content = content;
  message.editedAt = new Date();
  await message.save();

  return toPublicMessage(message);
}

export async function deleteMessage(userId, { messageId }) {
  const message = await Message.findById(messageId);
  if (!message || message.deletedAt) {
    throw AppError.notFound('Message not found');
  }
  if (message.sender.toString() !== userId.toString()) {
    throw AppError.forbidden('You can only delete your own messages');
  }

  message.deletedAt = new Date();
  message.content = '';
  message.attachments = [];
  await message.save();

  return toPublicMessage(message);
}

export async function listMessages(userId, channelId, { before, after, limit = 50 }) {
  await assertMemberChannel(userId, channelId);

  const query = { channel: channelId };
  if (before) {
    query._id = { $lt: new mongoose.Types.ObjectId(before) };
  } else if (after) {
    query._id = { $gt: new mongoose.Types.ObjectId(after) };
  }

  const sortDir = after ? 1 : -1;
  const messages = await Message.find(query)
    .sort({ _id: sortDir })
    .limit(limit);

  const ordered = after ? messages : messages.reverse();
  return ordered.map(toPublicMessage);
}

export async function markRead(userId, { channelId, lastReadMessageId }) {
  await assertMemberChannel(userId, channelId);

  const readState = await ReadState.findOneAndUpdate(
    { channel: channelId, user: userId },
    { lastReadMessageId, lastReadAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    channelId,
    userId: userId.toString(),
    lastReadMessageId: readState.lastReadMessageId?.toString() ?? null,
    lastReadAt: readState.lastReadAt,
  };
}
