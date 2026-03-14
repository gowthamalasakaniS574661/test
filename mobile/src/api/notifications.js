import apiClient from './client';

export const notificationsAPI = {
  getNotifications: (unreadOnly) => apiClient.get('/notifications', { params: { unreadOnly } }),
  markAsRead: (id) => apiClient.post(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post('/notifications/read-all'),
};
