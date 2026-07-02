import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.]+$/, 'letters, numbers, _ and . only'),
  displayName: z.string().trim().min(1).max(64),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const createChannelSchema = z.object({
  type: z.enum(['group', 'channel']),
  name: z.string().trim().min(1).max(80),
  topic: z.string().max(250).optional(),
  isPrivate: z.boolean().optional(),
  memberIds: z.array(z.string()).default([]),
});

export const patchChannelSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  topic: z.string().max(250).optional(),
  isPrivate: z.boolean().optional(),
});

export const startDmSchema = z.object({
  userId: z.string().min(1),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1),
});

export const attachmentSchema = z.object({
  url: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().nonnegative(),
  kind: z.enum(['image', 'video', 'audio', 'file']),
});

export const sendMessageSchema = z.object({
  channelId: z.string().min(1),
  content: z.string().max(4000).default(''),
  attachments: z.array(attachmentSchema).default([]),
  clientTempId: z.string().optional(),
});

// Same as sendMessageSchema but without channelId/clientTempId, which don't apply
// to the REST endpoint (channelId comes from the URL, there's no optimistic client echo).
export const createMessageBodySchema = sendMessageSchema.omit({ channelId: true, clientTempId: true });

export const editMessageSchema = z.object({
  messageId: z.string().min(1),
  content: z.string().min(1).max(4000),
});

export const deleteMessageSchema = z.object({
  messageId: z.string().min(1),
});

export const readMessageSchema = z.object({
  channelId: z.string().min(1),
  lastReadMessageId: z.string().min(1),
});

export const typingSchema = z.object({
  channelId: z.string().min(1),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const messagesQuerySchema = z.object({
  before: z.string().optional(),
  after: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});
