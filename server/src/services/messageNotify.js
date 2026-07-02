import * as presenceService from './presenceService.js';
import * as pushNotificationService from './pushNotificationService.js';

// Shared by both the REST message controller and the socket messageHandler so
// "notify offline members" logic isn't duplicated across the two entry points.
export async function notifyOfflineMembers(channel, senderId, message) {
  const recipientIds = channel.members
    .map((m) => (typeof m.user === 'object' ? m.user.id : m.user))
    .filter((id) => id !== senderId.toString());

  const offlineIds = [];
  for (const id of recipientIds) {
    if (!(await presenceService.isOnline(id))) offlineIds.push(id);
  }

  await Promise.all(
    offlineIds.map((id) =>
      pushNotificationService.sendPushToUser(id, {
        title: 'New message',
        body: message.content || 'Sent an attachment',
        channelId: message.channelId,
      })
    )
  );
}
