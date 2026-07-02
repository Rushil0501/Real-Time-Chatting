import { api } from './client.js';

export const authApi = {
  register: (payload) => api.post('/api/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/api/auth/login', payload).then((r) => r.data),
  refresh: () => api.post('/api/auth/refresh').then((r) => r.data),
  logout: () => api.post('/api/auth/logout').then((r) => r.data),
};

export const userApi = {
  me: () => api.get('/api/users/me').then((r) => r.data.user),
  search: (q) => api.get('/api/users/search', { params: { q } }).then((r) => r.data.users),
};

export const channelApi = {
  list: () => api.get('/api/channels').then((r) => r.data.channels),
  get: (id) => api.get(`/api/channels/${id}`).then((r) => r.data.channel),
  create: (payload) => api.post('/api/channels', payload).then((r) => r.data.channel),
  startDm: (userId) => api.post('/api/channels/dm', { userId }).then((r) => r.data.channel),
  update: (id, payload) => api.patch(`/api/channels/${id}`, payload).then((r) => r.data.channel),
  addMember: (id, userId) => api.post(`/api/channels/${id}/members`, { userId }).then((r) => r.data.channel),
  removeMember: (id, userId) => api.delete(`/api/channels/${id}/members/${userId}`).then((r) => r.data.channel),
};

export const messageApi = {
  list: (channelId, params) => api.get(`/api/channels/${channelId}/messages`, { params }).then((r) => r.data.messages),
  create: (channelId, payload) => api.post(`/api/channels/${channelId}/messages`, payload).then((r) => r.data.message),
};

export const uploadApi = {
  uploadFile: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      })
      .then((r) => r.data.attachment);
  },
};

export const pushApi = {
  getVapidPublicKey: () => api.get('/api/push/vapidPublicKey').then((r) => r.data.publicKey),
  subscribe: (subscription) => api.post('/api/push/subscribe', subscription).then((r) => r.data),
  unsubscribe: (endpoint) => api.delete('/api/push/subscribe', { data: { endpoint } }).then((r) => r.data),
};
